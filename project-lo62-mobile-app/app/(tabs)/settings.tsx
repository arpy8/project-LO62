import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Account Information</Text>

        <View style={styles.card}>
          <Image
            source={require('@/assets/images/amba.png')}
            style={styles.profileImage}
          />
          <Text style={styles.name}>Amba Singh</Text>
          <Text style={styles.email}>ambasingh@gmail.com</Text>
        </View>

        <TouchableOpacity style={styles.option}>
          <MaterialIcons name="account-circle" size={24} color="#0066cc" />
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <MaterialIcons name="security" size={24} color="#0066cc" />
          <Text style={styles.optionText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <MaterialIcons name="notifications" size={24} color="#0066cc" />
          <Text style={styles.optionText}>Notification Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <MaterialIcons name="help-outline" size={24} color="#0066cc" />
          <Text style={styles.optionText}>Help & Support</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 3,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#ff4d4d',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});