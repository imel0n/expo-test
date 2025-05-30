// app/trip-view.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Modal, // Import Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Import Picker
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for Trip and TripMember data structure
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

interface MonthOption {
  label: string;
  value: number;
}

// Key for storing trip data in AsyncStorage
const STORAGE_KEY = 'splend_trips';

// Component for displaying details of a single trip
export default function TripViewScreen() {
  // Hooks for navigation and accessing route parameters
  const router = useRouter();
  const navigation = useNavigation();
  const { tripId } = useLocalSearchParams();

  // State to hold the loaded trip data
  const [trip, setTrip] = useState<Trip | null>(null);

  // State for date pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());

  // Use layout effect to configure screen options (like hiding header)
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Function to load trip data from AsyncStorage
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
        // Find the specific trip by ID
        const foundTrip = parsedTrips.find((t: Trip) => t.id === tripId);
        if (foundTrip) {
          setTrip(foundTrip);
          // Initialize temporary dates when trip is loaded
          setTempStartDate(new Date(foundTrip.startDate));
          setTempEndDate(new Date(foundTrip.endDate));
        } else {
          setTrip(null);
        }
      } else {
        setTrip(null);
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      setTrip(null);
    }
  };

  // Use useFocusEffect to reload trip data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTrip();
    }, [tripId]) // Dependency array: reload if tripId changes (shouldn't happen here)
  );

  // Function to save the updated trip data to AsyncStorage
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
        // Update the specific trip in the array
        const updatedTrips = parsedTrips.map((t: Trip) =>
          t.id === updatedTrip.id ? updatedTrip : t
        );
        // Save the updated list back to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
        // Update the component's state with the saved trip
        setTrip(updatedTrip);
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  // Function to handle trip deletion
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

                // Filter out the trip to be deleted
                const updatedTrips = parsedTrips.filter((t: Trip) => t.id !== trip.id);
                // Save the updated list back to AsyncStorage
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));

                // Show success message and navigate back
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

  // Function to handle trip conclusion
  const concludeTrip = async () => {
    if (!trip) return;

    Alert.alert(
      'Conclude Trip',
      `Are you sure you want to conclude "${trip.name}"? This action cannot be undone.`,
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

                // Filter out the trip to be deleted
                const updatedTrips = parsedTrips.filter((t: Trip) => t.id !== trip.id);
                // Save the updated list back to AsyncStorage
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));

                // Show success message and navigate back
                Alert.alert('Success', 'Trip deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]);
              }
            } catch (error) {
              console.error('Error concluding trip:', error);
              Alert.alert('Error', 'Failed to conclude trip');
            }
          },
        },
      ]
    );
  };

  // Helper function to format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper function to calculate trip duration in days
  const calculateDuration = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Add 1 to include both start and end days in the duration
    if (diffDays === 0) {
        return '1 day';
    } else {
        return `${diffDays + 1} days`;
    }
  };

  // Generate date options for picker (Same as in index.tsx)
  const generateDateOptions = (): { years: number[]; months: MonthOption[]; days: number[] } => {
    const today = new Date();
    const years: number[] = [];
    const months: MonthOption[] = [];
    const days: number[] = [];

    // Years (current year + 5 years)
    for (let i = 0; i < 6; i++) {
      years.push(today.getFullYear() + i);
    }

    // Months
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    monthNames.forEach((month, index) => {
      months.push({ label: month, value: index });
    });

    // Days (1-31)
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }

    return { years, months, days };
  };

  const { years, months, days } = generateDateOptions();

  // Date picker handlers
  const handleStartDateDone = async () => {
    if (!trip) return;

    // Validate date before saving
    if (tempStartDate > trip.endDate) {
      Alert.alert('Error', 'Start date cannot be after the end date');
      return;
    }

    const updatedTrip = {
      ...trip,
      startDate: tempStartDate,
    };
    await saveTrip(updatedTrip);
    setShowStartDatePicker(false);
  };

  const handleEndDateDone = async () => {
    if (!trip) return;

     // Validate date before saving
     if (tempEndDate < trip.startDate) {
        Alert.alert('Error', 'End date cannot be before the start date');
        return;
      }

    const updatedTrip = {
      ...trip,
      endDate: tempEndDate,
    };
    await saveTrip(updatedTrip);
    setShowEndDatePicker(false);
  };

  // Function to navigate to the members management screen
  const navigateToMembers = () => {
    router.push({
      pathname: '/trip-members',
      params: { tripId: trip?.id }
    });
  };

  // Render a loading or error state if the trip is not found
  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Custom header for the 'Trip not found' state */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← All Trips</Text>
          </TouchableOpacity>
          {/* Placeholder for alignment when there's no title/button on the right */}
          <View style={styles.placeholder} />
        </View>
        {/* Message displayed when the trip data couldn't be loaded */}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Trip not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main render for the trip details screen
  return (
    <SafeAreaView style={styles.container}>
      {/* Custom header for the Trip Details view */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          {/* Button to navigate back to the previous screen (All Trips) */}
          <Text style={styles.backButton}>← All Trips</Text>
        </TouchableOpacity>
        {/* Title for the header */}
        <Text style={styles.headerTitle}></Text>
        {/* Placeholder for alignment when there's no button on the right */}
        <View style={styles.placeholder} />
      </View>

      {/* Scrollable container for the main content */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Section displaying the trip's main title */}
          <View style={styles.section}>
            <Text style={styles.tripTitle}>{trip.name}</Text>
          </View>

          {/* Section displaying trip duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration</Text>
            {/* Make the duration card tappable to open date pickers */}
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setTempStartDate(new Date(trip.startDate)); // Use trip state for initial value
                  setShowStartDatePicker(true);
                }}
              >
                <Text style={styles.dateButtonText}>
                  Start: {formatDate(trip.startDate)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setTempEndDate(new Date(trip.endDate)); // Use trip state for initial value
                  setShowEndDatePicker(true);
                }}
              >
                <Text style={styles.dateButtonText}>
                  End: {formatDate(trip.endDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.durationSubtextContainer}>
              <Text style={styles.durationSubtext}>
                {calculateDuration(trip.startDate, trip.endDate)}
              </Text>
            </View>
          </View>

          {/* Section dislpaying trip members */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Members</Text>
            </View>
            {/* Touchable card displaying a summary of members */}
            <TouchableOpacity style={styles.membersCard} onPress={navigateToMembers}>
              <Text style={styles.membersCount}>
                {trip.members.length} member{trip.members.length !== 1 ? 's' : ''}
              </Text>
              {/* Display a limited list of member usernames */}
              <View style={styles.membersList}>
                {trip.members.slice(0, 3).map((member, index) => (
                  <Text key={member.id} style={styles.memberName}>
                    {member.username}
                    {index < Math.min(trip.members.length - 1, 2) ? ', ' : ''}
                  </Text>
                ))}
                {/* Indicate if there are more members not shown */}
                {trip.members.length > 3 && (
                  <Text style={styles.memberName}>
                    +{trip.members.length - 3} more
                  </Text>
                )}
              </View>
              {/* Chevron icon to indicate tappable area */}
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section containing the conclude trip button */}
        <View style={styles.concludeSection}>
          {/* Button to trigger the delete trip confirmation */}
          <TouchableOpacity style={styles.concludeButton} onPress={concludeTrip}>
            <Text style={styles.concludeButtonText}>Conclude Trip</Text>
          </TouchableOpacity>
        </View>
        
        {/* Section containing the delete trip button */}
        <View style={styles.deleteSection}>
          {/* Button to trigger the delete trip confirmation */}
          <TouchableOpacity style={styles.deleteButton} onPress={deleteTrip}>
            <Text style={styles.deleteButtonText}>Delete Trip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Start Date Picker Modal */}
      <Modal
        visible={showStartDatePicker}
        animationType="slide"
        transparent={true} // Make the background transparent for better visual
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                <Text style={styles.datePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Select Start Date</Text>
              <TouchableOpacity onPress={handleStartDateDone}>
                <Text style={styles.datePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerRow}>
              <Picker
                style={styles.picker}
                selectedValue={tempStartDate.getFullYear()}
                onValueChange={(value) => {
                  const newDate = new Date(tempStartDate);
                  newDate.setFullYear(value);
                  setTempStartDate(newDate);
                }}
                dropdownIconColor="#fff"
                itemStyle={{ color: '#fff' }}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={year.toString()} value={year} />
                ))}
              </Picker>
              <Picker
                style={styles.picker}
                selectedValue={tempStartDate.getMonth()}
                onValueChange={(value) => {
                  const newDate = new Date(tempStartDate);
                  newDate.setMonth(value);
                  setTempStartDate(newDate);
                }}
                dropdownIconColor="#fff"
                itemStyle={{ color: '#fff' }}
              >
                {months.map((month) => (
                  <Picker.Item key={month.value} label={month.label} value={month.value} />
                ))}
              </Picker>
              <Picker
                style={styles.picker}
                selectedValue={tempStartDate.getDate()}
                onValueChange={(value) => {
                  const newDate = new Date(tempStartDate);
                  newDate.setDate(value);
                  setTempStartDate(newDate);
                }}
                dropdownIconColor="#fff"
                itemStyle={{ color: '#fff' }}
              >
                {days.map((day) => (
                  <Picker.Item key={day} label={day.toString()} value={day} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </Modal>

      {/* End Date Picker Modal */}
      <Modal
        visible={showEndDatePicker}
        animationType="slide"
        transparent={true} // Make the background transparent for better visual
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                <Text style={styles.datePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Select End Date</Text>
              <TouchableOpacity onPress={handleEndDateDone}>
                <Text style={styles.datePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerRow}>
              <Picker
                style={styles.picker}
                selectedValue={tempEndDate.getFullYear()}
                onValueChange={(value) => {
                  const newDate = new Date(tempEndDate);
                  newDate.setFullYear(value);
                  setTempEndDate(newDate);
                }}
                dropdownIconColor="#fff"
                itemStyle={{ color: '#fff' }}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={year.toString()} value={year} />
                ))}
              </Picker>
              <Picker
                style={styles.picker}
                selectedValue={tempEndDate.getMonth()}
                onValueChange={(value) => {
                  const newDate = new Date(tempEndDate);
                  newDate.setMonth(value);
                  setTempEndDate(newDate);
                }}
                dropdownIconColor="#fff"
                itemStyle={{ color: '#fff' }}
              >
                {months.map((month) => (
                  <Picker.Item key={month.value} label={month.label} value={month.value} />
                ))}
              </Picker>
              <Picker
                style={styles.picker}
                selectedValue={tempEndDate.getDate()}
                onValueChange={(value) => {
                  const newDate = new Date(tempEndDate);
                  newDate.setDate(value);
                  setTempEndDate(newDate);
                }}
                dropdownIconColor="#fff"
                itemStyle={{ color: '#fff' }}
              >
                {days.map((day) => (
                  <Picker.Item key={day} label={day.toString()} value={day} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Stylesheet for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#121212',
  },
  backButton: {
    fontSize: 16,
    color: '#0a84ff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    color: '#0a84ff',
    fontWeight: '500',
  },
  // Updated date related styles
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#1e1e1e',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  durationSubtextContainer: {
    marginTop: 8,
    alignItems: 'center', // Center the duration text
  },
  durationSubtext: {
    fontSize: 14,
    color: '#aaa',
  },
  // Existing styles remain

  membersCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersCount: {
    fontSize: 16,
    color: '#fff',
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
    color: '#aaa',
  },
  chevron: {
    fontSize: 20,
    color: '#777',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#aaa',
  },
  deleteSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  deleteButton: {
    backgroundColor: '#2c1a1a',
    borderWidth: 1,
    borderColor: '#4d2c2c',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff453a',
  },
  concludeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  concludeButton: {
    backgroundColor: '#34C759',
    borderWidth: 1,
    borderColor: '#4d2c2c',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  concludeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Styles for the date picker modal
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Position at the bottom
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  datePickerContainer: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden', // Ensures rounded corners
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#0a84ff',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    height: 200,
    backgroundColor: '#1e1e1e',
  },
  picker: {
    flex: 1,
    color: '#fff',
    backgroundColor: '#1e1e1e',
  },
});
