import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
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

const STORAGE_KEY = 'splend_trips';

export default function TripViewScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);

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

  const deleteTrip = async () => {
    if (!trip) return;

    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${trip.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedTrips = await AsyncStorage.getItem(STORAGE_KEY);
              if (storedTrips) {
                const parsedTrips = JSON.parse(storedTrips).map((trip: any) => ({
                  ...trip,
                  startDate: new Date(trip.startDate),
                  endDate: new Date(trip.endDate),
                  createdAt: new Date(trip.createdAt),
                }));
                
                const updatedTrips = parsedTrips.filter((t: Trip) => t.id !== trip.id);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
                
                Alert.alert('Success', 'Trip deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]);
              }
            } catch (error) {
              console.error('Error deleting trip:', error);
              Alert.alert('Error', 'Failed to delete trip');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDuration = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '1 day';
    } else if (diffDays === 1) {
      return '2 days';
    } else {
      return `${diffDays + 1} days`;
    }
  };

  const navigateToMembers = () => {
    router.push({
      pathname: '/trip-members',
      params: { tripId: trip?.id }
    });
  };

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Details</Text>
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
        <Text style={styles.headerTitle}>Trip Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Trip Title */}
          <View style={styles.section}>
            <Text style={styles.tripTitle}>{trip.name}</Text>
          </View>

          {/* Trip Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.durationCard}>
              <Text style={styles.durationText}>
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </Text>
              <Text style={styles.durationSubtext}>
                {calculateDuration(trip.startDate, trip.endDate)}
              </Text>
            </View>
          </View>

          {/* Trip Members */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Members</Text>
              <TouchableOpacity onPress={navigateToMembers}>
                <Text style={styles.manageButton}>Manage</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.membersCard} onPress={navigateToMembers}>
              <Text style={styles.membersCount}>
                {trip.members.length} member{trip.members.length !== 1 ? 's' : ''}
              </Text>
              <View style={styles.membersList}>
                {trip.members.slice(0, 3).map((member, index) => (
                  <Text key={member.id} style={styles.memberName}>
                    {member.username}
                    {index < Math.min(trip.members.length - 1, 2) ? ', ' : ''}
                  </Text>
                ))}
                {trip.members.length > 3 && (
                  <Text style={styles.memberName}>
                    +{trip.members.length - 3} more
                  </Text>
                )}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Trip Button */}
        <View style={styles.deleteSection}>
          <TouchableOpacity style={styles.deleteButton} onPress={deleteTrip}>
            <Text style={styles.deleteButtonText}>Delete Trip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  placeholder: {
    width: 50,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  tripTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageButton: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  durationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  durationText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    marginBottom: 4,
  },
  durationSubtext: {
    fontSize: 14,
    color: '#6c757d',
  },
  membersCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersCount: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    marginRight: 12,
  },
  membersList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 14,
    color: '#6c757d',
  },
  chevron: {
    fontSize: 20,
    color: '#adb5bd',
    marginLeft: 8,
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
  deleteSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c62828',
  },
});
