import React, { useState } from 'react';
import { supabase } from './Supabase';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default function AdminUploadScreen({ route }) {
  const { category } = route.params;

  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [thumbnail, setThumbnail] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function pickMedia(type) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === 'video'
         ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      setMediaType(type);

      if (type === 'video') {
        try {
          const { uri: thumbnailUri } =
            await VideoThumbnails.getThumbnailAsync(uri, { time: 1000 });
          setThumbnail(thumbnailUri);
        } catch (e) {}
      }
    }
  }

  async function uploadImage() {
    if (uploading) return;
    setUploading(true);

    if (!image) {
      alert('Pilih gambar dulu!');
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      const extension = mediaType === 'video'? 'mp4' : 'jpg';
      const mimeType = mediaType === 'video'? 'video/mp4' : 'image/jpeg';
      const fileName = `admin-${Date.now()}.${extension}`;

      formData.append('file', {
        uri: image,
        name: fileName,
        type: mimeType,
      });

      const { error } = await supabase.storage
       .from('posts')
       .upload(fileName, formData, {
          contentType: mimeType,
        });

      if (error) {
        setUploading(false);
        alert(error.message);
        return;
      }

      const { data: urlData } = supabase.storage
       .from('posts')
       .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;
      let thumbnailUrl = null;

      if (mediaType === 'video' && thumbnail) {
        const thumbName = `thumb-${Date.now()}.jpg`;
        const thumbFormData = new FormData();
        thumbFormData.append('file', {
          uri: thumbnail,
          name: thumbName,
          type: 'image/jpeg',
        });

        const { error: thumbError } = await supabase.storage
         .from('posts')
         .upload(thumbName, thumbFormData, {
            contentType: 'image/jpeg',
          });

        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
           .from('posts')
           .getPublicUrl(thumbName);
          thumbnailUrl = thumbUrlData.publicUrl;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // ✅ UDAH BENER: Tambahin.select() biar profile gak null
      const { data: profile } = await supabase
       .from('profiles')
       .select('name, avatar_url')
       .eq('user_id', user.id)
       .single();

      // ✅ UDAH BENER: Hapus author_name, pake image_url
      const postData = {
        image_url: imageUrl, // ✅ Sesuai nama kolom di database
        thumbnail_url: thumbnailUrl,
        user_id: user.id,
        title: title,
        caption: caption,
        status: 'approved',
        category,
        is_admin_post: true,
        media_type: mediaType,
        // author_name: profile?.name || '', // ❌ UDAH DIHAPUS
      };

      const { error: dbError } = await supabase
       .from('posts')
       .insert([postData]);

      if (dbError) {
        console.log('DB ERROR =', dbError);
        alert(dbError.message);
        setUploading(false);
        return;
      }

      setUploading(false);
      Alert.alert('Berhasil', 'Postingan berhasil diupload');
      setTitle('');
      setCaption('');
      setImage(null);
    } catch (err) {
      setUploading(false);
      console.log(err);
      alert('Upload gagal');
    }
  }

  return (
    //... UI lu tetap sama, gak usah diubah
    <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 15 }}>
      <Text style={{ color: 'black', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Upload {category}
      </Text>

      {!image? (
        <>
          <TouchableOpacity
            onPress={() => pickMedia('image')}
            style={{ backgroundColor: '#4CAF50', padding: 20, borderRadius: 15, marginBottom: 15 }}
          >
            <Text style={{ color: 'white', fontSize: 22, textAlign: 'center' }}>📷</Text>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', marginTop: 8 }}>
              Pilih Foto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => pickMedia('video')}
            style={{ backgroundColor: '#2196F3', padding: 20, borderRadius: 15 }}
          >
            <Text style={{ color: 'white', fontSize: 22, textAlign: 'center' }}>🎥</Text>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold', marginTop: 8 }}>
              Pilih Video
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
            <TouchableOpacity
              onPress={uploadImage}
              disabled={uploading}
              style={{ flex: 1, backgroundColor: uploading? '#888' : 'green', padding: 15, borderRadius: 10 }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                {uploading? 'Mengupload...' : 'Upload'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => pickMedia(mediaType)}
              style={{ flex: 1, backgroundColor: 'red', padding: 15, borderRadius: 10 }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                Ganti Foto
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Tulis judul..."
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
            style={{ backgroundColor: '#f5f5f5', color: 'black', height: 50, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, marginBottom: 15 }}
          />
          <TextInput
            placeholder="Tulis keterangan..."
            placeholderTextColor="#666"
            value={caption}
            onChangeText={setCaption}
            multiline
            textAlignVertical="top"
            style={{ backgroundColor: '#f5f5f5', color: 'black', padding: 15, borderRadius: 10, marginBottom: 15, minHeight: 120 }}
          />
          <Image source={{ uri: image }} style={{ width: '100%', height: 350, borderRadius: 15 }} />
        </>
      )}
    </View>
  );
}
