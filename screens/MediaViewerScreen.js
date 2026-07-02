import React, { useEffect, useState } from 'react';
import { supabase } from './Supabase';
import { Ionicons } from '@expo/vector-icons';
import {
    View,
    StyleSheet,
    Pressable,
    Text,
    Share,
    Image,
    TouchableOpacity,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
    useIsFocused,
} from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
    VideoView,
    useVideoPlayer,
} from 'expo-video';

export default function VideoViewerScreen({
    route,
    navigation,
}) {
    const {
        post,
        likesCount,
        commentsCount,
    } = route.params;
    const videoUrl = post.image_url;
    const isVideo =
        post?.media_type === 'video';
    const isFocused = useIsFocused();
    const [isPaused, setIsPaused] = useState(false);
    const [showIcon, setShowIcon] = useState(false);
    const [iconText, setIconText] = useState('');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(likesCount || 0);
    const [sharing, setSharing] = useState(false);
    const [shareMessage, setShareMessage] = useState('');
    const [showCaption, setShowCaption] = useState(false);
    const [isLongCaption, setIsLongCaption] = useState(false);
    const [captionLines, setCaptionLines] = useState(0);

    const togglePlayPause = () => {

        if (!player) return;

        if (isPaused) {

            if (
                duration > 0 &&
                currentTime >= duration - 0.5
            ) {
                player.currentTime = 0;
            }

            player.play();
            setIconText('▶');

        } else {
            player.pause();
            setIconText('⏸');
        }

        setIsPaused(!isPaused);

        setShowIcon(true);

        setTimeout(() => {
            setShowIcon(false);
        }, 500);
    };
    async function toggleLike() {

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: existingLike } =
            await supabase
                .from('likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single();

        if (existingLike) {

            await supabase
                .from('likes')
                .delete()
                .eq('post_id', post.id)
                .eq('user_id', user.id);

            setLiked(false);
            setLikes(prev => prev - 1);

        } else {

            await supabase
                .from('likes')
                .insert([
                    {
                        post_id: post.id,
                        user_id: user.id,
                    },
                ]);

            setLiked(true);
            setLikes(prev => prev + 1);
        }
    }
    async function sharePost() {
        if (sharing) return;

        setSharing(true);
        if (isVideo) {
            setShareMessage('Mengunduh video...');
        }
        try {
            const ext = isVideo ? '.mp4' : '.jpg';

            const fileUri =
                FileSystem.cacheDirectory +
                `${post.id}-${Date.now()}${ext}`;

            const download =
                await FileSystem.downloadAsync(
                    post.image_url,
                    fileUri
                );

            const canShare =
                await Sharing.isAvailableAsync();

            if (!canShare) return;

            await Sharing.shareAsync(download.uri);
            setSharing(false);
            setShareMessage('');

        } catch (error) {

            setSharing(false);
            setShareMessage('');

            console.log(error);
            alert('Gagal membagikan media');
        }
    }


    const player = useVideoPlayer(
        videoUrl,
        (player) => {
            player.loop = false;
            player.muted = false;
            player.play();
        }
    );
    useEffect(() => {
        const timer = setInterval(() => {
            if (!player) return;

            setCurrentTime(player.currentTime || 0);
            setDuration(player.duration || 0);
        }, 500);

        return () => clearInterval(timer);
    }, [player]);
    useEffect(() => {
        if (!duration) return;

        if (
            currentTime >= duration - 0.5 &&
            duration > 0
        ) {
            player.pause();
            player.currentTime = 0;

            setCurrentTime(0);

            setIsPaused(true);
            setShowIcon(false);
        }
    }, [currentTime, duration]);

    useEffect(() => {
        if (!player) return;

        if (isFocused) {
            setShowIcon(false);
            player.currentTime = 0;
            setCurrentTime(0);
            setIsPaused(false);

            player.play();
            player.muted = false;
        } else {
            player.pause();
            player.muted = true;
        }
    }, [isFocused]);
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);

        return `${mins}:${secs
            .toString()
            .padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons
                    name="chevron-back"
                    size={30}
                    color="#fff"
                />

                <Text
                    style={{
                        color: '#fff',
                        fontSize: 18,
                        fontWeight: 'bold',
                        marginLeft: 5,
                    }}
                >
                    Kembali
                </Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>

                {isVideo ? (
                    <VideoView
                        player={player}
                        style={styles.video}
                        nativeControls={false}
                        contentFit="contain"
                        key={post.id}
                    />
                ) : (
                    <Image
                        source={{ uri: post.image_url }}
                        style={styles.video}
                        resizeMode="contain"
                    />
                )}

                {isVideo && (
                    <Pressable
                        onPress={togglePlayPause}
                        style={{
                            position: 'absolute',
                            top: 80,
                            left: 0,
                            right: 0,
                            bottom: 80,
                        }}
                    />
                )}

                {showIcon && (
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                color: 'white',
                                fontSize: 80,
                                fontWeight: 'bold',
                            }}
                        >
                            {iconText}
                        </Text>
                    </View>
                )}
                <View
                    style={{
                        position: 'absolute',
                        right: 15,
                        bottom: 180,
                        alignItems: 'center',
                        zIndex: 2000,
                        elevation: 2000,
                    }}
                >

                    <Pressable onPress={toggleLike}>

                        <Text
                            style={{
                                fontSize: 30,
                                textAlign: 'center',
                            }}
                        >
                            {liked ? '❤️' : '🤍'}
                        </Text>

                        <Text
                            style={{
                                color: 'white',
                                fontSize: 15,
                                textAlign: 'center',
                                fontWeight: 'bold',
                            }}
                        >
                            {likes}
                        </Text>

                    </Pressable>

                    <Pressable
                        onPress={() => {
                            navigation.navigate('Comments', {
                                post,
                            });
                        }}
                    >

                        <Text
                            style={{
                                color: 'white',
                                fontSize: 25,
                                textAlign: 'center',
                            }}
                        >
                            💬
                        </Text>

                        <Text
                            style={{
                                color: 'white',
                                fontSize: 15,
                                textAlign: 'center',
                                fontWeight: 'bold',
                            }}
                        >
                            {commentsCount}
                        </Text>

                    </Pressable>

                    <Pressable
                        onPress={sharePost}
                        disabled={sharing}
                        style={{ alignItems: 'center' }}
                    >
                        <Ionicons
                            name="arrow-redo-outline"
                            size={32}
                            color={sharing ? "red" : "white"}
                        />

                        {sharing && isVideo && (
                            <Text
                                style={{
                                    color: 'white',
                                    fontSize: 10,
                                    marginTop: 2,
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                }}
                            >
                                Mengunduh...
                            </Text>
                        )}
                    </Pressable>

                </View>
                <View
                    style={{
                        position: 'absolute',
                        bottom: 30,
                        width: '100%',
                        paddingHorizontal: 15,
                    }}
                >
                    <View
                        style={{
                            position: 'absolute',
                            left: 15,
                            bottom: 100,
                            width: '65%',
                        }}
                    >
                        <Text
                            style={{
                                color: 'white',
                                fontSize: 20,
                                fontWeight: 'bold',
                            }}
                        >
                            {post.title}
                        </Text>

                        <Text
                            style={{
                                color: 'white',
                                fontSize: 15,
                                marginTop: 5,
                            }}
                            numberOfLines={showCaption ? 0 : 2}

                        >
                            {post.caption}
                        </Text>
                        <Text
                            style={{
                                position: 'absolute',
                                opacity: 0,
                                width: '100%',
                                fontSize: 15,
                            }}
                            onTextLayout={(e) => {
                                setCaptionLines(e.nativeEvent.lines.length);
                            }}
                        >
                            {post.caption}
                        </Text>
                        {captionLines > 2 && (
                            <TouchableOpacity
                                onPress={() => setShowCaption(!showCaption)}
                            >
                                <Text
                                    style={{
                                        color: '#00ff88',
                                        fontWeight: 'bold',
                                        marginTop: 5,
                                    }}
                                >
                                    {showCaption
                                        ? '........... Sembunyikan'
                                        : 'Lihat selengkapnya .........'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {isVideo && (
                        <>
                            <Slider
                                minimumValue={0}
                                maximumValue={duration || 1}
                                value={currentTime}
                                onSlidingComplete={(value) => {
                                    player.currentTime = value;
                                }}
                            />

                            <Text
                                style={{
                                    color: 'white',
                                    textAlign: 'center',
                                    marginTop: 4,
                                    fontWeight: 'bold',
                                }}
                            >
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </Text>
                        </>
                    )}
                </View>

            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
    },

    video: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 15,
        zIndex: 9999,
        elevation: 9999,
        flexDirection: 'row',
        alignItems: 'center',
    },

});