import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

const HeaderTitle = () => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  }}>
    <Text style={{
      textAlign: 'center',
      color: '#EAD8CD',
      fontSize: 22,
      fontWeight: '700',
      fontFamily: 'SpaceMono',
      letterSpacing: 1,
    }}>
      LO62
    </Text>
  </View>
);

export default function TabLayout() {
  const router = useRouter();
  
  const commonScreenOptions = {
    headerShown: false,
    headerStyle: {
      backgroundColor: '#6A3492',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      height: Platform.OS === 'ios' ? 110 : 80,
    },
    headerTitleAlign: 'center' as const,
    tabBarActiveTintColor: '#006400',
    tabBarInactiveTintColor: '#666666',
    tabBarStyle: {
      display: "none",
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0',
      height: Platform.OS === 'ios' ? 88 : 64,
      paddingBottom: Platform.OS === 'ios' ? 28 : 8,
      paddingTop: 8,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 4,
    },
  };

  return (
    <Tabs screenOptions={commonScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: () => <HeaderTitle />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => { router.push('/settings') }}
            >
              <TabBarIcon name="gear" color="#FFF" style={{ marginRight: 20 }} />
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}