import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface EventMember {
  id: string;
  username: string;
}

interface Event {
  id: string;
  name: string;
  members: EventMember[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

// Mock users for search functionality
const MOCK_USERS: EventMember[] = [
  { id: '1', username: 'john_doe' },
  { id: '2', username: 'jane_smith' },
  { id: '3', username: 'mike_wilson' },
  { id: '4', username: 'sarah_jones' },
  { id: '5', username: 'alex_brown' },
];

const STORAGE_KEY = 'splend_events';

export default function HomeScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<EventMember[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Load events from local storage on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Event storage functions (designed for easy Firebase migration)
  const loadEvents = async () => {
    try {
      const storedEvents = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents).map((event: any) => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          createdAt: new Date(event.createdAt),
        }));
        setEvents(parsedEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const saveEvents = async (updatedEvents: Event[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('Error saving events:', error);
    }
  };

  // Create new event
  const createEvent = async () => {
    if (!newEventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Please add at least one member');
      return;
    }

    if (startDate >= endDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    const newEvent: Event = {
      id: Date.now().toString(), // In Firebase, this would be auto-generated
      name: newEventName.trim(),
      members: selectedMembers,
      startDate,
      endDate,
      createdAt: new Date(),
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);

    // Reset form
    setNewEventName('');
    setSelectedMembers([]);
    setMemberSearchQuery('');
    setStartDate(new Date());
    setEndDate(new Date());
    setIsModalVisible(false);

    // Alert.alert('Success', 'Event created successfully!');
  };

  // Filter users based on search query
  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      user.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) &&
      !selectedMembers.some((member) => member.id === user.id)
  );

  // Add member to selected list
  const addMember = (user: EventMember) => {
    setSelectedMembers([...selectedMembers, user]);
    setMemberSearchQuery('');
  };

  // Remove member from selected list
  const removeMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter((member) => member.id !== userId));
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render event item
  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity style={styles.eventCard}>
      <Text style={styles.eventName}>{item.name}</Text>
      <Text style={styles.eventDates}>
        {formatDate(item.startDate)} - {formatDate(item.endDate)}
      </Text>
      <Text style={styles.eventMembers}>
        {item.members.length} member{item.members.length !== 1 ? 's' : ''}
      </Text>
      <View style={styles.membersList}>
        {item.members.slice(0, 3).map((member, index) => (
          <Text key={member.id} style={styles.memberName}>
            {member.username}
            {index < Math.min(item.members.length - 1, 2) ? ', ' : ''}
          </Text>
        ))}
        {item.members.length > 3 && (
          <Text style={styles.memberName}>
            +{item.members.length - 3} more
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Events</Text>
        <TouchableOpacity
          style={styles.newEventButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.newEventButtonText}>+ New Event</Text>
        </TouchableOpacity>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No events yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create your first group event to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Event Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Event</Text>
            <TouchableOpacity onPress={createEvent}>
              <Text style={styles.createButton}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Event Name */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Event Name</Text>
              <TextInput
                style={styles.textInput}
                value={newEventName}
                onChangeText={setNewEventName}
                placeholder="Enter event name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Date Selection */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Dates</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    Start: {formatDate(startDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    End: {formatDate(endDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Member Search */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Add Members</Text>
              <TextInput
                style={styles.textInput}
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
                placeholder="Search users by username"
                placeholderTextColor="#999"
              />

              {/* Search Results */}
              {memberSearchQuery.length > 0 && (
                <View style={styles.searchResults}>
                  {filteredUsers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.searchResultItem}
                      onPress={() => addMember(user)}
                    >
                      <Text style={styles.searchResultText}>
                        {user.username}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {filteredUsers.length === 0 && (
                    <Text style={styles.noResultsText}>No users found</Text>
                  )}
                </View>
              )}

              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <View style={styles.selectedMembers}>
                  <Text style={styles.selectedMembersTitle}>
                    Selected Members:
                  </Text>
                  {selectedMembers.map((member) => (
                    <View key={member.id} style={styles.selectedMemberItem}>
                      <Text style={styles.selectedMemberText}>
                        {member.username}
                      </Text>
                      <TouchableOpacity onPress={() => removeMember(member.id)}>
                        <Text style={styles.removeMemberButton}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Date Pickers */}
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setEndDate(selectedDate);
                }
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  newEventButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newEventButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
  },
  eventsList: {
    padding: 20,
  },
  eventCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  eventDates: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  eventMembers: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 12,
    color: '#6c757d',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6c757d',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  createButton: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
  },
  searchResults: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 150,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  searchResultText: {
    fontSize: 16,
    color: '#212529',
  },
  noResultsText: {
    padding: 12,
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  selectedMembers: {
    marginTop: 16,
  },
  selectedMembersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  selectedMemberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedMemberText: {
    fontSize: 14,
    color: '#1976d2',
  },
  removeMemberButton: {
    fontSize: 18,
    color: '#d32f2f',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
});


/*
import { StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
*/
