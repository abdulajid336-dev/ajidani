import React from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';

export default function InboxScreen() {
  const notifications = [
    {
      id: 1,
      title: 'Selamat datang di Ajidani',
      time: '1 hari lalu',
      icon: '🎉',
    },
    {
      id: 2,
      title: 'Fitur Seni Budaya telah aktif',
      time: '1 hari lalu',
      icon: '🎭',
    },
    {
      id: 3,
      title: 'Profil berhasil diperbarui',
      time: '2 hari lalu',
      icon: '👤',
    },
    {
      id: 4,
      title: 'Terima kasih telah menggunakan Ajidani',
      time: '3 hari lalu',
      icon: '❤️',
    },
  ];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 18,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: '#2e7d32',
          marginTop: 10,
          marginBottom: 20,
        }}
      >
        Kotak Masuk
      </Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 15,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
            }}
          >
            Pesan
          </Text>

          <View
            style={{
              backgroundColor: '#2e7d32',
              marginLeft: 8,
              borderRadius: 20,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            >
              4
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: '#2e7d32',
            fontWeight: 'bold',
          }}
        >
          Lihat Semua →
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {notifications.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 18,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              elevation: 3,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 4,
              shadowOffset: {
                width: 0,
                height: 2,
              },
            }}
          >
            <Text
              style={{
                fontSize: 36,
                marginRight: 15,
              }}
            >
              {item.icon}
            </Text>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: '#222',
                }}
              >
                {item.title}
              </Text>

              <Text
                style={{
                  color: '#777',
                  marginTop: 4,
                }}
              >
                {item.time}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}