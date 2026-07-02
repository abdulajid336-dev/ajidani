import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './Supabase';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Keyboard,
} from 'react-native';

export default function CommentsScreen({ route }) {
  const { post } = route.params;
  const [comments, setComments] = useState([]);
  const flatListRef = useRef(null);
  const [newComment, setNewComment] = useState('');
  const [inputHeight, setInputHeight] = useState(45);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  async function getComments() {
    // ✅ BENERIN: Join ke profiles, hapus author_name, user_name, user_avatar
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, 
        comment, 
        created_at,
        user_id,
        profiles!user_id!left (
          name,
          avatar_url
        )
      `)
      .eq('post_id', post.id)
      .order('id', { ascending: false })
      .limit(100);

    if (error) {
      console.log('LOG Gagal ambil komen:', error.message);
      return;
    }
    setComments(data || []);
  }

  async function sendComment() {
    if (!newComment.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // ✅ BENERIN: Hapus user_name & author_name dari insert
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: post.id,
          user_id: user.id,
          comment: newComment,
          // user_name: user.email, // ❌ HAPUS
          // author_name: profile?.name || '', // ❌ HAPUS
        },
      ]);

    if (error) {
      console.log('LOG Gagal kirim komen:', error.message);
      alert(error.message);
      return;
    }

    getComments();
    setNewComment('');
    setInputHeight(45);

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }, 300);
  }

  useEffect(() => {
    getComments();
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, padding: 15 }}>
        <Text style={{ color: 'black', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
          Komentar
        </Text>

        <FlatList
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ref={flatListRef}
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View
              style={{
                marginBottom: 15,
                padding: 10,
                borderWidth: 1,
                borderColor: '#333',
                borderRadius: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {/* ✅ BENERIN: Pake item.profiles?.avatar_url */}
                {item.profiles?.avatar_url ? (
                  <Image
                    source={{ uri: item.profiles.avatar_url }}
                    resizeMode="cover"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      marginRight: 10,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      marginRight: 10,
                      backgroundColor: '#666',
                    }}
                  />
                )}

                <View style={{ flex: 1 }}>
                  {/* ✅ BENERIN: Pake item.profiles?.name */}
                  <Text style={{ color: '#4da6ff', fontWeight: 'bold' }}>
                    {item.profiles?.name || 'Anonim'}
                  </Text>

                  <Text style={{ color: 'gray', fontSize: 12, marginTop: 2 }}>
                    {new Date(item.created_at).toLocaleString('id-ID')}
                  </Text>

                  <Text style={{ color: 'black', marginTop: 5 }}>
                    {item.comment}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: 'black' }}>Belum ada komentar</Text>
          }
        />
      </View>

      <View
        style={{
          padding: 10,
          paddingBottom: 40,
          borderTopWidth: 1,
          borderTopColor: 'gray',
          marginBottom: keyboardHeight + 17,
        }}
      >
        <TextInput
          placeholder="Tulis komentar..."
          placeholderTextColor="gray"
          value={newComment}
          onChangeText={setNewComment}
          multiline={true}
          numberOfLines={1}
          textAlignVertical="top"
          onContentSizeChange={(e) => {
            setInputHeight(
              Math.min(120, Math.max(45, e.nativeEvent.contentSize.height))
            );
          }}
          onFocus={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToOffset({
                offset: 0,
                animated: true,
              });
            }, 300);
          }}
          style={{
            backgroundColor: 'white',
            color: 'black',
            height: inputHeight,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#ddd',
          }}
        />
        <TouchableOpacity
          onPress={sendComment}
          style={{
            marginTop: 10,
            backgroundColor: '#1e88e5',
            paddingVertical: 7,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Kirim</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
