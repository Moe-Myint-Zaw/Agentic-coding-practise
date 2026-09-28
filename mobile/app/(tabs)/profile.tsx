import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useSegments, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RemoteImage } from "@/components/remote-image";
import { ScreenFrame } from "@/components/screen-frame";
import { useAuth } from "@/contexts/auth-context";
import { useLocale } from "@/contexts/locale-context";
import { useTheme } from "@/contexts/theme-context";
import { api, resolveMediaUrl } from "@/lib/api-client";

export default function ProfileScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const segments = useSegments();
  const isStandaloneProfile = segments[0] === "profile";
  const routeProfileId = Array.isArray(id) ? id[0] : id;
  const profileId = isStandaloneProfile ? routeProfileId : user?.id;
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const client = useQueryClient();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? "");
  const [coverImage, setCoverImage] = useState(user?.coverImage ?? "");
  const [uploading, setUploading] = useState<"profile" | "cover" | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", profileId],
    queryFn: () => api.profile(profileId!),
    enabled: Boolean(profileId),
  });

  const posts = useQuery({
    queryKey: ["user-posts", profileId],
    queryFn: () => api.userPosts(profileId!),
    enabled: Boolean(profileId),
  });

  const update = useMutation({
    mutationFn: () => api.updateProfile(user!.id, { displayName, bio, profileImage, coverImage }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["user-posts", user?.id] }),
        client.invalidateQueries({ queryKey: ["profile", profileId] }),
      ]);
      setIsEditing(false);
    },
  });

  const follow = useMutation({
    mutationFn: () =>
      profile.data?.isFollowing
        ? api.unfollowUser(profileId!)
        : api.followUser(profileId!),
    onSuccess: () => client.invalidateQueries({ queryKey: ["profile", profileId] }),
  });

  const likePost = useMutation({
    mutationFn: api.togglePostLike,
    onSuccess: () => client.invalidateQueries({ queryKey: ["user-posts", profileId] }),
  });

  const viewedUser = profile.data ?? user;
  const isOwnProfile = profileId === user?.id;

  const pickPhoto = async (type: "profile" | "cover") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    setUploading(type);
    try {
      const uploaded = await api.uploadImage({
        uri: asset.uri,
        name: asset.fileName ?? `${type}-photo.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      });
      if (type === "profile") {
        setProfileImage(uploaded.url);
        const updated = await api.updateProfile(user!.id, { profileImage: uploaded.url });
        client.setQueryData(["profile", profileId], (current: typeof viewedUser | undefined) => current ? { ...current, ...updated } : current);
      } else {
        setCoverImage(uploaded.url);
        const updated = await api.updateProfile(user!.id, { coverImage: uploaded.url });
        client.setQueryData(["profile", profileId], (current: typeof viewedUser | undefined) => current ? { ...current, ...updated } : current);
      }
      await client.invalidateQueries({ queryKey: ["profile", profileId] });
    } finally {
      setUploading(null);
    }
  };

  if (!user || !viewedUser) return null;

  const displayedProfileImage = isOwnProfile
    ? profileImage || viewedUser.profileImage || ""
    : viewedUser.profileImage || "";
  const displayedCoverImage = isOwnProfile
    ? coverImage || viewedUser.coverImage || ""
    : viewedUser.coverImage || "";

  return (
    <ScreenFrame
      edges={isStandaloneProfile ? ["left", "right", "bottom"] : ["top", "left", "right"]}
      keyboardAware={isOwnProfile && isEditing}
    >
    <View style={styles.page}>
      <View style={styles.hero}>
        {isOwnProfile ? <Pressable accessibilityRole="button" accessibilityLabel={t("coverPhoto")} onPress={() => pickPhoto("cover")} disabled={uploading !== null} style={styles.coverPhoto}>
          {displayedCoverImage ? <RemoteImage uri={resolveMediaUrl(displayedCoverImage)} style={styles.coverImage} /> : <Text style={styles.photoPlaceholder}>{t("coverPhoto")}</Text>}
        </Pressable> : <View style={styles.coverPhoto}>
          {displayedCoverImage ? <RemoteImage uri={resolveMediaUrl(displayedCoverImage)} style={styles.coverImage} /> : null}
        </View>}
        <View style={styles.profileHeaderRow}>
          {isOwnProfile ? <Pressable accessibilityRole="button" accessibilityLabel={t("profilePhoto")} onPress={() => pickPhoto("profile")} disabled={uploading !== null} style={styles.avatarWrap}>
            {displayedProfileImage ? (
              <RemoteImage uri={resolveMediaUrl(displayedProfileImage)} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {(viewedUser.displayName || viewedUser.username).slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable> : <View style={styles.avatarWrap}>
            {displayedProfileImage ? <RemoteImage uri={resolveMediaUrl(displayedProfileImage)} style={styles.avatarImage} /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{(viewedUser.displayName || viewedUser.username).slice(0, 1).toUpperCase()}</Text></View>}
          </View>}

          <View style={styles.metaBlock}>
            <Text style={styles.name}>{viewedUser.displayName || viewedUser.username}</Text>
            <Text style={styles.handle}>@{viewedUser.username}</Text>
            {viewedUser.bio ? <Text style={styles.bioText}>{viewedUser.bio}</Text> : null}
            {!isOwnProfile && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={viewedUser.isFollowing ? t("unfollow") : t("follow")}
                disabled={follow.isPending}
                style={[styles.followButton, viewedUser.isFollowing && styles.followButtonFollowing]}
                onPress={() => follow.mutate()}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    viewedUser.isFollowing && styles.followButtonTextFollowing,
                  ]}
                >
                  {follow.isPending
                    ? t("loading")
                    : viewedUser.isFollowing
                      ? t("unfollow")
                      : t("follow")}
                </Text>
              </Pressable>
            )}
          </View>
          {isOwnProfile ? <Pressable accessibilityRole="button" accessibilityLabel={isEditing ? t("cancel") : t("editProfile")} style={styles.editButton} onPress={() => setIsEditing((editing) => !editing)}>
            <Text style={styles.editButtonText}>{isEditing ? t("cancel") : t("editProfile")}</Text>
          </Pressable> : null}
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statText}><Text style={styles.statValue}>{posts.data?.items?.length ?? 0}</Text> posts</Text>
          <Text style={styles.statText}><Text style={styles.statValue}>{viewedUser.followerCount ?? 0}</Text> followers</Text>
          <Text style={styles.statText}><Text style={styles.statValue}>{viewedUser.followingCount ?? 0}</Text> following</Text>
        </View>
      </View>

      {isOwnProfile && isEditing ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={50}
            placeholder={t("displayName")}
            placeholderTextColor={colors.mutedText}
          />
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            maxLength={160}
            multiline
            placeholder={t("bio")}
            placeholderTextColor={colors.mutedText}
          />
          <Pressable
            accessibilityLabel={t("save")}
            style={styles.button}
            onPress={() => update.mutate()}
          >
            <View style={styles.buttonContent}>
              <SymbolView
                name={{
                  ios: "checkmark.circle.fill",
                  android: "save",
                  web: "save",
                }}
                size={17}
                tintColor={colors.surface}
              />
              <Text style={styles.buttonText}>
                {update.isPending ? t("loading") : t("save")}
              </Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.sectionRow}>
        <SymbolView
          name={{ ios: "text.bubble.fill", android: "article", web: "article" }}
          size={16}
          tintColor={colors.mutedText}
        />
        <Text style={styles.section}>{t("home")}</Text>
      </View>
      {posts.isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={posts.data?.items ?? []}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="never"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <Text style={styles.postTitle}>{item.author.displayName || item.author.username}</Text>
                <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.postContent}>{item.content}</Text>
              {item.images && item.images.length > 0 ? (
                <View style={styles.mediaGrid}>
                  {item.images.map((image: string, index: number) => (
                    <RemoteImage
                      key={`${item.id}-${index}`}
                      uri={resolveMediaUrl(image)}
                      style={item.images.length === 1 ? styles.singleImage : styles.mediaImage}
                    />
                  ))}
                </View>
              ) : null}

              <View style={styles.actionsRow}>
                <Pressable
                  accessibilityLabel={`${item.likes.some((like) => like.userId === user?.id) ? t("unlike") : t("like")}`}
                  hitSlop={8}
                  onPress={() => likePost.mutate(item.id)}
                >
                  <View style={styles.actionItem}>
                    <SymbolView
                      pointerEvents="none"
                      name={{
                        ios: item.likes.some((like) => like.userId === user?.id) ? "heart.fill" : "heart",
                        android: "favorite",
                        web: "favorite",
                      }}
                      size={18}
                      tintColor={item.likes.some((like) => like.userId === user?.id) ? colors.tint : colors.mutedText}
                    />
                    <Text style={item.likes.some((like) => like.userId === user?.id) ? styles.actionTextActive : styles.actionText}>
                      {item._count.likes}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  accessibilityLabel={`${t("comments")} ${item._count.comments}`}
                  hitSlop={8}
                  onPress={() =>
                    router.push({ pathname: "/post/[id]", params: { id: item.id } })
                  }
                >
                  <View style={styles.actionItem}>
                    <SymbolView
                      pointerEvents="none"
                      name={{ ios: "bubble.left", android: "comment", web: "comment" }}
                      size={18}
                      tintColor={colors.mutedText}
                    />
                    <Text style={styles.actionText}>{item._count.comments}</Text>
                  </View>
                </Pressable>

                <Pressable
                  accessibilityLabel="Share post"
                  hitSlop={8}
                  onPress={() => Share.share({ message: item.content })}
                >
                  <View style={styles.actionItem}>
                    <SymbolView
                      pointerEvents="none"
                      name={{ ios: "square.and.arrow.up", android: "share", web: "share" }}
                      size={18}
                      tintColor={colors.mutedText}
                    />
                  </View>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
    </ScreenFrame>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    page: { backgroundColor: colors.background, flex: 1 },
    hero: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    coverPhoto: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 10, height: 120, justifyContent: "center", marginBottom: 16, overflow: "hidden", width: "100%" },
    coverImage: { height: 120, width: "100%" },
    photoPlaceholder: { color: colors.mutedText },
    profileHeaderRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 16,
    },
    avatarWrap: {
      borderRadius: 40,
      height: 88,
      overflow: "hidden",
      width: 88,
    },
    avatarImage: {
      borderRadius: 40,
      height: "100%",
      width: "100%",
    },
    avatarFallback: {
      alignItems: "center",
      backgroundColor: colors.tint,
      borderRadius: 40,
      height: 88,
      justifyContent: "center",
      width: 88,
    },
    avatarText: {
      color: colors.surface,
      fontSize: 30,
      fontWeight: "700",
    },
    metaBlock: {
      flex: 1,
    },
    name: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
    },
    handle: { color: colors.mutedText, marginTop: 3 },
    bioText: {
      color: colors.text,
      marginTop: 8,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 18,
    },
    statText: {
      color: colors.mutedText,
      flex: 1,
      fontSize: 12,
    },
    statValue: {
      color: colors.text,
      fontWeight: "700",
    },
    form: { gap: 10, padding: 16 },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 9,
      borderWidth: 1,
      color: colors.text,
      padding: 13,
    },
    bioInput: { minHeight: 75, textAlignVertical: "top" },
    button: {
      alignItems: "center",
      backgroundColor: colors.tint,
      borderRadius: 9,
      padding: 13,
    },
    editButton: { alignItems: "center", borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
    editButtonText: { color: colors.text, fontSize: 12, fontWeight: "700" },
    buttonContent: { alignItems: "center", flexDirection: "row", gap: 7 },
    buttonText: { color: colors.surface, fontWeight: "700" },
    followButton: {
      alignItems: "center",
      backgroundColor: colors.tint,
      borderRadius: 9,
      marginTop: 12,
      minWidth: 120,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    followButtonFollowing: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    followButtonText: {
      color: colors.surface,
      fontWeight: "700",
      textAlign: "center",
    },
    followButtonTextFollowing: {
      color: colors.text,
    },
    sectionRow: { alignItems: "center", flexDirection: "row" },
    section: {
      color: colors.mutedText,
      fontSize: 13,
      fontWeight: "700",
      padding: 16,
      textTransform: "uppercase",
    },
    postCard: {
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      padding: 16,
    },
    postHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    postTitle: {
      color: colors.text,
      fontWeight: "700",
    },
    postDate: {
      color: colors.mutedText,
      fontSize: 12,
    },
    postContent: {
      color: colors.text,
      marginBottom: 12,
    },
    mediaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    singleImage: {
      borderRadius: 10,
      height: 220,
      width: "100%",
    },
    mediaImage: {
      borderRadius: 10,
      height: 120,
      width: "48%",
    },
    actionsRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 20,
      marginTop: 14,
    },
    actionItem: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
    },
    actionText: {
      color: colors.mutedText,
      fontSize: 13,
      fontWeight: "600",
    },
    actionTextActive: {
      color: colors.tint,
      fontSize: 13,
      fontWeight: "700",
    },
  });
