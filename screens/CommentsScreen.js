import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './Supabase';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
export default function CommentsScreen({ route }) {

  const { post } = route.params;
  const [comments, setComments] = useState([]);
  const flatListRef = useRef(null);
  const [newComment, setNewComment] = useState('');
  async function getComments() {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post.id)
      .order('id', { ascending: false });

    setComments(data || []);
  }

  async function sendComment() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('user_id', user.id)
      .single();

    if (!user) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: post.id,
          user_id: user.id,
          user_name: user.email,
          author_name: profile?.name || '',
          user_avatar: profile?.avatar_url || '',
          comment: newComment,
        },
      ]);

    if (!error) {
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
  }

  useEffect(() => {
    getComments();
  }, []);
  const [inputHeight, setInputHeight] = useState(45);
  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: '#fff',
      }}
      behavior="padding"
    >
      <View
        style={{
          flex: 1,
          padding: 15,
        }}
      >
        <Text
          style={{
            color: 'black',
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 20,
          }}
        >
          Komentar
        </Text>

        <FlatList
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
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}
              >
                {item.user_avatar ? (
                  <Image
                    source={{
                      uri: item.user_avatar,
                    }}
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
                  <Text
                    style={{
                      color: '#4da6ff',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.author_name || item.user_name}
                  </Text>

                  <Text
                    style={{
                      color: 'gray',
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {new Date(item.created_at).toLocaleString('id-ID')}
                  </Text>

                  <Text
                    style={{
                      color: 'black',
                      marginTop: 5,
                    }}
                  >
                    {item.comment}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text
              style={{
                color: 'black',
              }}
            >
              Belum ada komentar
            </Text>
          }
        />
      </View>

      <View
        style={{
          padding: 10,
          paddingBottom: 5,
          borderTopWidth: 1,
          borderTopColor: 'gray',
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
              Math.min(
                120,
                Math.max(45, e.nativeEvent.contentSize.height)
              )
            );
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
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            Kirim
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}