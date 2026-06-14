import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { supabase } from './Supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';


export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [posts, setPosts] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [bio, setBio] = useState('');
  const [newBio, setNewBio] = useState('');
  useFocusEffect(
    React.useCallback(() => {
      getProfile();
      getMyPosts();
    }, [])
  );

  async function getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setEmail(user.email);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (!error && data) {
      setName(data.name);
      setNewName(data.name);

      setBio(data.bio || '');
      setNewBio(data.bio || '');

      setAvatarUrl(data.avatar_url || '');
    }
  }
  async function getMyPosts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false });

    if (!error) {
      setPosts(data || []);
    }
  }
  async function saveProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        name: newName,
        bio: newBio,
      })
      .eq('user_id', user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setName(newName);
    setBio(newBio);
    setEditMode(false);

    alert('Profil berhasil diperbarui');
  }
  async function pickImage() {

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (result.canceled) return;

    const image = result.assets[0];

    setAvatarUrl(image.uri);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const fileName =
      user.id + '-' + Date.now() + '.jpg';

    const base64 =
      await FileSystem.readAsStringAsync(
        image.uri,
        {
          encoding:
            FileSystem.EncodingType.Base64,
        }
      );

    const arrayBuffer =
      decode(base64);
    const { error: uploadError } =
      await supabase.storage
        .from('avatars')
        .upload(
          fileName,
          arrayBuffer,
          {
            contentType: 'image/jpeg',
            upsert: true,
          }
        );

    if (uploadError) {
      alert(uploadError.message);
      return;
    }
    const { data: publicUrlData } =
      supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    const publicUrl =
      publicUrlData.publicUrl;

    const { error: updateError } =
      await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
        })
        .eq('user_id', user.id);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    alert('Foto profil berhasil disimpan');
  }
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f7faf7',
      padding: 20,

    },

    title: {
      color: '#2e7d32',
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 30,
    },

    label: {
      color: '#999',
      fontSize: 16,
      marginTop: 10,
    },

    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignSelf: 'center',
      marginBottom: 20,
    },

    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 20,
    },

    avatarText: {
      color: '#fff',
      fontWeight: 'bold',
    },

    value: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
    },
  });
  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>Profil Saya</Text>

      <TouchableOpacity
        onPress={() => {
          pickImage();
        }}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              FOTO
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <Text
        style={{
          color: '#222',
          fontSize: 22,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        {name}
      </Text>

      <Text
        style={{
          color: '#666',
          textAlign: 'center',
          marginBottom: 5,
        }}
      >
        {email}
      </Text>

      <Text
        style={{
          color: '#666',
          textAlign: 'center',
          marginBottom: 15,
        }}
      >
        {bio || 'Belum ada bio'}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          marginBottom: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setEditMode(!editMode);
            setNewName(name);
            setNewBio(bio);
          }}
          style={{
            flex: 1,
            backgroundColor: '#4CAF50',
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            Edit Profil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await supabase.auth.signOut();
          }}
          style={{
            flex: 1,
            backgroundColor: '#e53935',
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
      {editMode && (
        <View
          style={{
            marginBottom: 20,
          }}
        >
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Nama baru"
            placeholderTextColor="#999"
            style={{
              backgroundColor: 'white',
              color: 'white',
              padding: 12,
              borderRadius: 10,
              marginBottom: 10,
            }}
          />
          <TextInput
            value={newBio}
            onChangeText={setNewBio}
            placeholder="Bio"
            placeholderTextColor="#999"
            multiline={true}
            style={{
              backgroundColor: 'white',
              color: 'white',
              padding: 12,
              borderRadius: 10,
              marginBottom: 10,
              minHeight: 80,
            }}
          />
          <TouchableOpacity
            onPress={saveProfile}
            style={{
              backgroundColor: 'green',
              padding: 12,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              Simpan
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <Text
        style={{
          color: '#2e7d32',
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 15,
          marginTop: 10,
        }}
      >
        Semua Postingan Saya

      </Text>
      {posts.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() =>
            navigation.navigate('DetailPost', {
              post: item,
              fromProfile: true,
            })
          }
        >
          <View
            style={{
              width: '100%',
              backgroundColor: 'white',
              borderRadius: 10,
              marginBottom: 15,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{
                uri:
                  item.media_type === 'video'
                    ? item.thumbnail_url
                    : item.image_url,
              }}
              style={{
                width: '100%',
                height: 180,
              }}
            />
            {item.media_type === 'video' && (
              <View
                style={{
                  position: 'absolute',
                  top: 70,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 50,
                    fontWeight: 'bold',
                  }}
                >
                  ▶
                </Text>
              </View>
            )}

            <View
              style={{
                padding: 10,
              }}
            >
              <Text
                style={{
                  color: '#222',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
              >
                {item.title || 'Tanpa Judul'}
              </Text>

              <Text
                style={{
                  color: '#999',
                  marginTop: 5,
                }}
              >
                📅 {new Date(item.created_at).toLocaleDateString('id-ID')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

    </ScrollView>
  );
}
