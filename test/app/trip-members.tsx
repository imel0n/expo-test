import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface TripMember {
  id: string;
  username: string;
}

interface Trip {
  id: string;
  name: string;
  members: TripMember[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

// Mock users for search functionality
const MOCK_USERS: TripMember[] = [
  { id: '1', username: 'Javier Chua' },
  { id: '2', username: 'Chavier Jua' },
];

const STORAGE_KEY = 'splend_trips';

export default function TripMembersScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    try {
      const storedTrips = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTrips) {
        const parsedTrips = JSON.parse(storedTrips).map((trip: any) => ({
          ...trip,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate),
          createdAt: new Date(trip.createdAt),
        }));
        const foundTrip = parsedTrips.find((t: Trip) => t.id === tripId);
        setTrip(foundTrip || null);
      }
    } catch (error) {
      console.error('Error loading trip:', error);
    }
  };

  const saveTrip = async (updatedTrip: Trip) => {
    try {
      const storedTrips = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTrips) {
        const parsedTrips = JSON.parse(storedTrips).map((trip: any) => ({
          ...trip,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate),
          createdAt: new Date(trip.createdAt),
        }));
        const updatedTrips = parsedTrips.map((t: Trip) =>
          t.id === updatedTrip.id ? updatedTrip : t
        );
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
        setTrip(updatedTrip);
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const addMember = async (user: TripMember) => {
    if (!trip) return;

    if (trip.members.some(member => member.id === user.id)) {
      Alert.alert('Error', 'User is already a member of this trip');
      return;
    }

    const updatedTrip = {
      ...trip,
      members: [...trip.members, user],
    };

    await saveTrip(updatedTrip);
    setSearchQuery('');
    setIsAddingMember(false);
  };

  const removeMember = async (memberId: string) => {
    if (!trip) return;

    if (trip.members.length === 1) {
      Alert.alert('Error', 'Trip must have at least one member');
      return;
    }

    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedTrip = {
              ...trip,
              members: trip.members.filter(member => member.id !== memberId),
            };
            await saveTrip(updatedTrip);
          },
        },
      ]
    );
  };

  // Filter users based on search query and exclude existing members
  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !trip?.members.some((member) => member.id === user.id)
  );

  const renderMemberItem = ({ item }: { item: TripMember }) => (
    <View style={styles.memberItem}>
      <Text style={styles.memberUsername}>{item.username}</Text>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeMember(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchResultItem = ({ item }: { item: TripMember }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => addMember(item)}
    >
      <Text style={styles.searchResultText}>{item.username}</Text>
      <Text style={styles.addButtonText}>Add</Text>
    </TouchableOpacity>
  );

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Members</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Trip not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <TouchableOpacity onPress={() => setIsAddingMember(!isAddingMember)}>
          <Text style={styles.addButton}>
            {isAddingMember ? 'Cancel' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Add Member Section */}
        {isAddingMember && (
          <View style={styles.addMemberSection}>
            <Text style={styles.sectionTitle}>Add New Member</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search users by username"
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <View style={styles.searchResults}>
                <FlatList
                  data={filteredUsers}
                  renderItem={renderSearchResultItem}
                  keyExtractor={(item) => item.id}
                  style={styles.searchResultsList}
                  keyboardShouldPersistTaps="handled"
                />
                {filteredUsers.length === 0 && (
                  <Text style={styles.noResultsText}>No users found</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Current Members */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            Current Members ({trip.members.length})
          </Text>
          <FlatList
            data={trip.members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            style={styles.membersList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    fontSize: 16,
    color: '#007bff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  addButton: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addMemberSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    maxHeight: 200,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  searchResultText: {
    fontSize: 16,
    color: '#212529',
  },
  addButtonText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  noResultsText: {
    padding: 12,
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  membersSection: {
    flex: 1,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  memberUsername: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#6c757d',
  },
});
