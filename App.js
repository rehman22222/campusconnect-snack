import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Switch, Image, StyleSheet, SafeAreaView, StatusBar, Dimensions, Modal, FlatList, Linking, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import QRCode from 'react-native-qrcode-svg';
import StarRating from 'react-native-star-rating-widget';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker'; // Add this import


const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const EVENTS_API = 'https://682a4023ab2b5004cb3646ee.mockapi.io/events';
const INTERACTION_API = 'https://682a4023ab2b5004cb3646ee.mockapi.io/interaction';

// Theme Context
const ThemeContext = createContext();
const themes = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#6366f1',
      background: '#f8fafc',
      card: '#ffffff',
      text: '#1e293b',
      border: '#e2e8f0',
      surface: '#ffffff',
      accent: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: ['#6366f1', '#8b5cf6'],
      tabBar: '#ffffff',
      tabIconActive: '#6366f1',
      tabIconInactive: '#64748b'
    }
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#818cf8',
      background: '#0f172a',
      card: '#1e293b',
      text: '#f8fafc',
      border: '#334155',
      surface: '#1e293b',
      accent: '#a78bfa',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      gradient: ['#4338ca', '#7c3aed'],
      tabBar: '#1e293b',
      tabIconActive: '#818cf8',
      tabIconInactive: '#94a3b8'
    }
  }
};

// Custom Components
const CustomPicker = ({ selectedValue, onValueChange, children, style }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();
  const items = React.Children.map(children, child => ({ label: child.props.label, value: child.props.value }));
  const selectedItem = items.find(item => item.value === selectedValue);

  return (
    <View>
      <TouchableOpacity 
        style={[styles.pickerBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }, style]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.pickerTxt, { color: theme.colors.text }]}>{selectedItem ? selectedItem.label : 'Select...'}</Text>
        <Icon name="arrow-drop-down" size={20} color={theme.colors.text} />
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Option</Text>
            <FlatList 
              data={items} 
              keyExtractor={(item) => item.value} 
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.modalItem, 
                    { 
                      backgroundColor: selectedValue === item.value ? theme.colors.primary + '20' : 'transparent',
                      borderBottomColor: theme.colors.border
                    }
                  ]} 
                  onPress={() => { onValueChange(item.value); setModalVisible(false); }}
                >
                  <Text style={[styles.modalItemTxt, { color: theme.colors.text }]}>{item.label}</Text>
                  {selectedValue === item.value && <Icon name="check" size={20} color={theme.colors.primary} />}
                </TouchableOpacity>
              )} 
            />
            <TouchableOpacity 
              onPress={() => setModalVisible(false)} 
              style={[styles.modalClose, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.modalCloseTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
CustomPicker.Item = ({ label, value }) => null;

const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => { 
    AsyncStorage.getItem('darkTheme').then(saved => saved && setIsDarkMode(saved === 'true')).catch(console.log); 
  }, []);
  
  const toggleTheme = async () => { 
    const newTheme = !isDarkMode; 
    setIsDarkMode(newTheme); 
    await AsyncStorage.setItem('darkTheme', newTheme.toString()).catch(console.log); 
  };
  
  return (
    <ThemeContext.Provider value={{ 
      theme: isDarkMode ? themes.dark : themes.light, 
      isDarkMode, 
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => useContext(ThemeContext);

const GradientButton = ({ title, onPress, style, disabled = false }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled} 
      style={[styles.gradBtn, style, disabled && styles.disBtn]} 
      activeOpacity={0.8}
    >
      <LinearGradient 
        colors={disabled ? ['#9ca3af', '#6b7280'] : theme.colors.gradient} 
        style={styles.gradBtnInner} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.gradBtnTxt, { opacity: disabled ? 0.6 : 1 }]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const CustomInput = ({ placeholder, value, onChangeText, secureTextEntry = false, icon, style }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.inputCont, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }, style]}>
      {icon && <Icon name={icon} size={20} color={theme.colors.border} style={styles.inputIcon} />}
      <TextInput 
        placeholder={placeholder} 
        value={value} 
        onChangeText={onChangeText} 
        secureTextEntry={secureTextEntry} 
        style={[styles.textInput, { color: theme.colors.text }]} 
        placeholderTextColor={theme.colors.border} 
      />
    </View>
  );
};

const AnimatedCard = ({ children, style }) => {
  const { theme } = useTheme();
  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: theme.colors.card, 
        shadowColor: theme.colors.text,
        borderColor: theme.colors.border
      }, 
      style
    ]}>
      {children}
    </View>
  );
};

// Screens
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const { theme } = useTheme();

  const login = async () => {
    if (!email || !password) return alert('Please fill in all fields');
    setLoading(true);
    try { 
      const stored = await AsyncStorage.getItem(`user_${email}`); 
      if (stored && JSON.parse(stored).password === password) { 
        await AsyncStorage.setItem('currentUser', email);
        navigation.replace('Main', { userEmail: email }); 
      } else {
        alert('Invalid credentials'); 
      }
    } catch { 
      alert('Login failed. Please try again.'); 
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <LinearGradient colors={theme.colors.gradient} style={styles.headerGrad}>
        <View style={styles.logoContainer}>
          <Icon name="school" size={60} color="white" />
          <Text style={styles.appTitle}>CampusConnect</Text>
          <Text style={styles.appSubtitle}>Connect • Learn • Grow</Text>
        </View>
      </LinearGradient>
      <View style={styles.formContainer}>
        <AnimatedCard style={styles.loginCard}>
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>Welcome Back</Text>
          <Text style={[styles.formSubtitle, { color: theme.colors.border }]}>Sign in to continue</Text>
          <CustomInput 
            placeholder="Email" 
            value={email} 
            onChangeText={setEmail} 
            icon="email" 
            style={{ marginBottom: 16 }} 
          />
          <CustomInput 
            placeholder="Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            icon="lock" 
            style={{ marginBottom: 24 }} 
          />
          <GradientButton 
            title={loading ? "Signing In..." : "Sign In"} 
            onPress={login} 
            disabled={loading} 
            style={{ marginBottom: 16 }} 
          />
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              New? <Text style={styles.linkTextBold}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </AnimatedCard>
      </View>
    </SafeAreaView>
  );
}

function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false); 
  const { theme } = useTheme();

  const register = async () => {
    if (!email || !password || !confirmPassword || !name || !studentId || !department || !semester) 
      return alert('Please fill in all fields');
    if (password !== confirmPassword) return alert('Passwords do not match');
    if (password.length < 6) return alert('Password must be at least 6 characters');
    setLoading(true);
    try { 
      await AsyncStorage.setItem(`user_${email}`, JSON.stringify({ 
        email, 
        password, 
        name, 
        studentId, 
        department, 
        semester,
        avatar: null // No avatar during registration
      }));
      await AsyncStorage.setItem('currentUser', email);
      alert('Account created! 🎉'); 
      navigation.replace('Main', { userEmail: email });
    } catch { 
      alert('Registration failed.'); 
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
        <LinearGradient colors={theme.colors.gradient} style={styles.headerGrad}>
          <View style={styles.logoContainer}>
            <Icon name="person-add" size={60} color="white" />
            <Text style={styles.appTitle}>Join Us</Text>
            <Text style={styles.appSubtitle}>Create your account</Text>
          </View>
        </LinearGradient>
        <ScrollView 
          contentContainerStyle={styles.registerFormContainer}
          keyboardShouldPersistTaps="handled"
        >
          <AnimatedCard style={styles.loginCard}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Create Account</Text>
            <CustomInput placeholder="Full Name" value={name} onChangeText={setName} icon="person" style={{ marginBottom: 16 }} />
            <CustomInput placeholder="Student ID" value={studentId} onChangeText={setStudentId} icon="badge" style={{ marginBottom: 16 }} />
            <CustomInput placeholder="Department" value={department} onChangeText={setDepartment} icon="school" style={{ marginBottom: 16 }} />
            <CustomInput placeholder="Semester" value={semester} onChangeText={setSemester} icon="class" style={{ marginBottom: 16 }} />
            <CustomInput placeholder="Email" value={email} onChangeText={setEmail} icon="email" style={{ marginBottom: 16 }} />
            <CustomInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry icon="lock" style={{ marginBottom: 16 }} />
            <CustomInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry icon="lock" style={{ marginBottom: 24 }} />
            <GradientButton title={loading ? "Creating..." : "Create Account"} onPress={register} disabled={loading} style={{ marginBottom: 16 }} />
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                Have an account? <Text style={styles.linkTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </AnimatedCard>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
// RecommendationBar for HomeScreen
const RecommendationBar = ({ events, onCategory, onSort, selectedCategory, selectedSort }) => {
  const { theme } = useTheme();
  // Unique categories from events
  const categories = Array.from(new Set(events.map(e => e.category))).filter(Boolean);
  const sorts = [
    { label: 'Newest', value: 'Newest' },
    { label: 'Alphabetical', value: 'Alphabetical' }
  ];
  return (
    <View style={styles.recommendationBar}>
      <Text style={[styles.recommendationBarTitle, { color: theme.colors.text }]}>Recommended: </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
        {['All', ...categories].map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.recommendationBtn,
              {
                backgroundColor: selectedCategory === cat ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.primary,
              }
            ]}
            onPress={() => onCategory(cat)}
          >
            <Text style={[
              styles.recommendationBtnText,
              { color: selectedCategory === cat ? 'white' : theme.colors.primary }
            ]}>{cat}</Text>
          </TouchableOpacity>
        ))}
        {sorts.map(sort => (
          <TouchableOpacity
            key={sort.value}
            style={[
              styles.recommendationBtn,
              {
                backgroundColor: selectedSort === sort.value ? theme.colors.accent : theme.colors.surface,
                borderColor: theme.colors.accent,
              }
            ]}
            onPress={() => onSort(sort.value)}
          >
            <Text style={[
              styles.recommendationBtnText,
              { color: selectedSort === sort.value ? 'white' : theme.colors.accent }
            ]}>{sort.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
function HomeScreen({ navigation }) {
  const [events, setEvents] = useState([]); 
  const [search, setSearch] = useState(''); 
  const [category, setCategory] = useState('All'); 
  const [sort, setSort] = useState('Newest'); 
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  const { theme } = useTheme(); 
  const [loading, setLoading] = useState(true);

  // Fetch events and user registrations
  useEffect(() => { 
    const fetchEvents = async () => {
      try {
        const response = await axios.get(EVENTS_API);
        const eventsWithImages = response.data.map(event => ({
          ...event,
          image: event.image || 'https://via.placeholder.com/400x200?text=Event+Image'
        }));
        setEvents(eventsWithImages);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();

    // Fetch registered event IDs for this user
    const fetchRegistered = async () => {
      const allKeys = await AsyncStorage.getAllKeys();
      const regKeys = allKeys.filter(key => key.startsWith('reg_'));
      setRegisteredEventIds(regKeys.map(key => key.replace('reg_', '')));
    };
    fetchRegistered();
  }, []);

  // Find the category the user registers for the most
  const registeredEvents = events.filter(e => registeredEventIds.includes(e.id.toString()));
  const categoryFrequency = {};
  registeredEvents.forEach(ev => {
    if (ev.category) {
      categoryFrequency[ev.category] = (categoryFrequency[ev.category] || 0) + 1;
    }
  });
  const sortedCategories = Object.entries(categoryFrequency).sort((a, b) => b[1] - a[1]);
  const mostFrequentCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : null;

  // Recommended events: upcoming events from user's top category that they haven't registered yet
  const recommendedEvents = events.filter(
    e => mostFrequentCategory && e.category === mostFrequentCategory && !registeredEventIds.includes(e.id.toString())
  ).slice(0, 5); // show max 5 recommendations

  // Current filters as before
  const filtered = events
    .filter(e => (category === 'All' || e.category === category) && 
      (e.name.toLowerCase().includes(search.toLowerCase()) || 
       e.venue.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => sort === 'Newest' ? 
      new Date(b.time) - new Date(a.time) : 
      a.name.localeCompare(b.name));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Upcoming Events</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Icon name="settings" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      <View style={[styles.filtersContainer, { backgroundColor: theme.colors.surface }]}>
        <CustomInput 
          placeholder="Search events..." 
          value={search} 
          onChangeText={setSearch} 
          icon="search" 
          style={{ marginBottom: 12 }} 
        />
        {/* RecommendationBar for quick filter chips remains */}
        <RecommendationBar
          events={events}
          currentCategory={category}
          currentSort={sort}
          onCategoryPress={setCategory}
          onSortPress={setSort}
        />
        {/* Personalized Recommendations */}
        {mostFrequentCategory && recommendedEvents.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{
              fontWeight: 'bold',
              fontSize: 16,
              marginBottom: 8,
              color: theme.colors.text
            }}>
              Recommended for you ({mostFrequentCategory})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 8}}>
              {recommendedEvents.map(ev => (
                <TouchableOpacity key={ev.id} onPress={() => navigation.navigate('Details', { event: ev })}>
                  <AnimatedCard style={{ width: 170, marginRight: 12, padding: 0 }}>
                    <Image source={{ uri: ev.image }} style={{ width: 170, height: 90, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
                    <View style={{ padding: 10 }}>
                      <Text style={{ fontWeight: 'bold', color: theme.colors.text, fontSize: 14 }} numberOfLines={2}>{ev.name}</Text>
                      <Text style={{ color: theme.colors.border, fontSize: 12 }} numberOfLines={1}>{ev.venue}</Text>
                      <Text style={{ color: theme.colors.border, fontSize: 12 }}>{new Date(ev.time).toLocaleDateString()}</Text>
                    </View>
                  </AnimatedCard>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        <View style={styles.filtersRow}>
          <View style={[styles.pickerContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <CustomPicker selectedValue={category} onValueChange={setCategory}>
              <CustomPicker.Item label="All Categories" value="All" />
              <CustomPicker.Item label="Workshop" value="Workshop" />
              <CustomPicker.Item label="Seminar" value="Seminar" />
              <CustomPicker.Item label="Sports" value="Sports" />
              <CustomPicker.Item label="Cultural" value="Cultural" />
            </CustomPicker>
          </View>
          <View style={[styles.pickerContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <CustomPicker selectedValue={sort} onValueChange={setSort}>
              <CustomPicker.Item label="Newest First" value="Newest" />
              <CustomPicker.Item label="Alphabetical" value="Alphabetical" />
            </CustomPicker>
          </View>
        </View>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading events...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => navigation.navigate('Details', { event: item })} 
              activeOpacity={0.9}
            >
              <AnimatedCard style={styles.eventCard}>
                <Image source={{ uri: item.image }} style={styles.eventImage} />
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, { color: theme.colors.text }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  </View>
                  <View style={styles.eventDetails}>
                    <View style={styles.detailRow}>
                      <Icon name="calendar-today" size={16} color={theme.colors.border} />
                      <Text style={[styles.eventTime, { color: theme.colors.border }]}>
                        {new Date(item.time).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name="location-on" size={16} color={theme.colors.border} />
                      <Text style={[styles.eventVenue, { color: theme.colors.border }]}>{item.venue}</Text>
                    </View>
                  </View>
                  <Text style={[styles.eventDescription, { color: theme.colors.text }]} numberOfLines={3}>
                    {item.description}
                  </Text>
                </View>
              </AnimatedCard>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="search-off" size={48} color={theme.colors.border} />
              <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No events found</Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.colors.border }]}>
                Try adjusting your search criteria
              </Text>
            </View>
          }
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
function RegisteredEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all events
        const eventsResponse = await axios.get(EVENTS_API);
        setEvents(eventsResponse.data.map(event => ({
          ...event,
          image: event.image || 'https://via.placeholder.com/400x200?text=Event+Image'
        })));
        
        // Get registered event IDs from AsyncStorage
        const allKeys = await AsyncStorage.getAllKeys();
        const regKeys = allKeys.filter(key => key.startsWith('reg_'));
        const regEvents = regKeys.map(key => key.replace('reg_', ''));
        
        // Filter events to only show registered ones
        const filtered = eventsResponse.data.filter(event => 
          regEvents.includes(event.id.toString())
        );
        
        setRegisteredEvents(filtered);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Events</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading your events...</Text>
        </View>
      ) : registeredEvents.length > 0 ? (
        <FlatList
          data={registeredEvents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('Details', { event: item })} 
              activeOpacity={0.9}
            >
              <AnimatedCard style={styles.eventCard}>
                <Image source={{ uri: item.image || 'https://via.placeholder.com/400x200?text=Event+Image' }} style={styles.eventImage} />
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, { color: theme.colors.text }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <View style={[styles.categoryBadge, { backgroundColor: theme.colors.success }]}>
                      <Text style={styles.categoryText}>Registered</Text>
                    </View>
                  </View>
                  <View style={styles.eventDetails}>
                    <View style={styles.detailRow}>
                      <Icon name="calendar-today" size={16} color={theme.colors.border} />
                      <Text style={[styles.eventTime, { color: theme.colors.border }]}>
                        {new Date(item.time).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name="location-on" size={16} color={theme.colors.border} />
                      <Text style={[styles.eventVenue, { color: theme.colors.border }]}>{item.venue}</Text>
                    </View>
                  </View>
                </View>
              </AnimatedCard>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="event-busy" size={48} color={theme.colors.border} />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No registered events</Text>
          <Text style={[styles.emptyStateSubtitle, { color: theme.colors.border }]}>
            Register for events to see them here
          </Text>
          <GradientButton 
            title="Browse Events" 
            onPress={() => navigation.navigate('Home')} 
            style={{ marginTop: 20 }} 
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function NotificationsScreen() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading notifications
    const timer = setTimeout(() => {
      setNotifications([
        {
          id: 1,
          title: 'Welcome to CampusConnect!',
          message: 'Start exploring events and seminars happening around campus.',
          time: '2 hours ago',
          read: false
        },
        {
          id: 2,
          title: 'Seminar Reminder',
          message: 'Your registered seminar "AI in Education" starts in 1 hour.',
          time: '1 day ago',
          read: true
        },
        {
          id: 3,
          title: 'New Workshop Added',
          message: 'Check out the new "React Native Fundamentals" workshop next week.',
          time: '3 days ago',
          read: true
        }
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading notifications...</Text>
        </View>
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <AnimatedCard style={[
              styles.notificationCard, 
              !item.read && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }
            ]}>
              <View style={styles.notificationHeader}>
                <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.notificationTime, { color: theme.colors.border }]}>
                  {item.time}
                </Text>
              </View>
              <Text style={[styles.notificationMessage, { color: theme.colors.text }]}>
                {item.message}
              </Text>
            </AnimatedCard>
          )}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="notifications-off" size={48} color={theme.colors.border} />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No notifications</Text>
          <Text style={[styles.emptyStateSubtitle, { color: theme.colors.border }]}>
            You'll see important updates here
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function ProfileScreen({ navigation }) {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const currentEmail = await AsyncStorage.getItem('currentUser');
        if (!currentEmail) {
          setLoading(false);
          return;
        }
        const userData = await AsyncStorage.getItem(`user_${currentEmail}`);
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    };
    const unsubscribe = navigation.addListener("focus", loadUser);
    loadUser();
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Icon name="settings" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading profile...</Text>
        </View>
      ) : user ? (
        <ScrollView contentContainerStyle={styles.profileContainer} showsVerticalScrollIndicator={false}>
          <AnimatedCard style={styles.profileCard}>
            <View style={styles.profileHeader}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.profileAvatar} />
              ) : (
                <View style={[styles.profileAvatar, { backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                  <Icon name="person" size={40} color={theme.colors.card} />
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.colors.text }]}>{user.name}</Text>
                <Text style={[styles.profileEmail, { color: theme.colors.border }]}>{user.email}</Text>
              </View>
            </View>
            <View style={styles.profileDetails}>
              <View style={[styles.detailItem, { borderBottomColor: theme.colors.border }]}>
                <Icon name="badge" size={20} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Student ID:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{user.studentId}</Text>
              </View>
              <View style={[styles.detailItem, { borderBottomColor: theme.colors.border }]}>
                <Icon name="school" size={20} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Department:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{user.department}</Text>
              </View>
              <View style={[styles.detailItem, { borderBottomColor: theme.colors.border }]}>
                <Icon name="class" size={20} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Semester:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{user.semester}</Text>
              </View>
            </View>
            <View style={styles.profileActions}>
              <TouchableOpacity 
                style={[styles.profileActionBtn, { backgroundColor: theme.colors.surface }]}
                onPress={() => navigation.navigate('EditProfile', { user })}
              >
                <Icon name="edit" size={20} color={theme.colors.primary} />
                <Text style={[styles.profileActionText, { color: theme.colors.primary }]}>
                  Edit Profile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.profileActionBtn, { backgroundColor: theme.colors.surface }]}
                onPress={toggleTheme}
              >
                <Icon 
                  name={isDarkMode ? "wb-sunny" : "nights-stay"} 
                  size={20} 
                  color={theme.colors.primary} 
                />
                <Text style={[styles.profileActionText, { color: theme.colors.primary }]}>
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>
          <AnimatedCard style={styles.statsCard}>
            <Text style={[styles.statsTitle, { color: theme.colors.text }]}>My Activity</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
                <Icon name="event" size={24} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>12</Text>
                <Text style={[styles.statLabel, { color: theme.colors.border }]}>Events</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
                <Icon name="check-circle" size={24} color={theme.colors.success} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>8</Text>
                <Text style={[styles.statLabel, { color: theme.colors.border }]}>Attended</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
                <Icon name="star" size={24} color={theme.colors.warning} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>4.8</Text>
                <Text style={[styles.statLabel, { color: theme.colors.border }]}>Avg Rating</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
                <Icon name="forum" size={24} color={theme.colors.accent} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>15</Text>
                <Text style={[styles.statLabel, { color: theme.colors.border }]}>Feedbacks</Text>
              </View>
            </View>
          </AnimatedCard>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="person-off" size={48} color={theme.colors.border} />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No user data</Text>
          <Text style={[styles.emptyStateSubtitle, { color: theme.colors.border }]}>
            Please log in again.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function EditProfileScreen({ route, navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const getUser = async () => {
      try {
        let userObj = route.params?.user;
        if (!userObj) {
          const currentEmail = await AsyncStorage.getItem('currentUser');
          setEmail(currentEmail);
          const userData = await AsyncStorage.getItem(`user_${currentEmail}`);
          userObj = userData ? JSON.parse(userData) : {};
        } else {
          setEmail(userObj.email);
        }
        setName(userObj.name || '');
        setStudentId(userObj.studentId || '');
        setDepartment(userObj.department || '');
        setSemester(userObj.semester || '');
        setImage(userObj.avatar || null);
      } catch { }
    };
    getUser();
  }, [route.params]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera roll permission required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    if (!name || !studentId || !department || !semester) {
      Alert.alert('Missing Info', 'Please fill out all required fields.');
      return;
    }
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem(`user_${email}`);
      let old = userData ? JSON.parse(userData) : {};
      const newUser = {
        ...old,
        name,
        studentId,
        department,
        semester,
        avatar: image,
      };
      await AsyncStorage.setItem(`user_${email}`, JSON.stringify(newUser));
      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Could not update profile.");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={[styles.headerContainer, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.profileContainer]}>
          <AnimatedCard style={styles.profileCard}>
            <Text style={[styles.formTitle, { color: theme.colors.text, textAlign: 'center', marginBottom: 20 }]}>Edit Your Profile</Text>
            <View style={styles.avatarContainer}>
              {image ? (
                <Image source={{ uri: image }} style={styles.profileAvatar} />
              ) : (
                <View style={[styles.profileAvatar, {
                  backgroundColor: theme.colors.border,
                  justifyContent: 'center',
                  alignItems: 'center'
                }]}>
                  <Icon name="person" size={40} color={theme.colors.card} />
                </View>
              )}
              <TouchableOpacity onPress={pickImage} style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.uploadButtonText}>Choose Photo</Text>
              </TouchableOpacity>
            </View>
            <CustomInput placeholder="Full Name" value={name} onChangeText={setName} icon="person" style={{ marginBottom: 16 }} />
            <CustomInput placeholder="Student ID" value={studentId} onChangeText={setStudentId} icon="badge" style={{ marginBottom: 16 }} />
            <CustomInput placeholder="Department" value={department} onChangeText={setDepartment} icon="school" style={{ marginBottom: 16 }} />
            <CustomInput placeholder="Semester" value={semester} onChangeText={setSemester} icon="class" style={{ marginBottom: 16 }} />
            <GradientButton
              title={loading ? "Saving..." : "Save Changes"}
              onPress={saveProfile}
              disabled={loading}
              style={{ marginTop: 10 }}
            />
          </AnimatedCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params;
  const [registered, setRegistered] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const value = await AsyncStorage.getItem(`reg_${event.id}`);
        if (value !== null) {
          setRegistered(true);
        }
      } catch (error) {
        console.error('Error checking registration:', error);
      }
    };
    checkRegistration();
  }, [event.id]);

  const handleRegister = async () => {
    try {
      await AsyncStorage.setItem(`reg_${event.id}`, 'registered');
      setRegistered(true);
      alert('Successfully registered for this event!');
    } catch (error) {
      console.error('Error registering:', error);
      alert('Failed to register for the event. Please try again.');
    }
  };

  const handleCheckIn = () => {
    setCheckedIn(true);
    alert('Check-in confirmed! Enjoy the event.');
  };

  const handleFeedback = () => {
    navigation.navigate('Feedback', { event });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: event.image || 'https://via.placeholder.com/400x200?text=Event+Image' }} style={styles.detailsEventImage} />
        <View style={styles.detailsContent}>
          <AnimatedCard style={styles.detailsCard}>
            <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>{event.name}</Text>
            <View style={styles.detailsInfo}>
              <View style={styles.detailsInfoItem}>
                <Icon name="calendar-today" size={20} color={theme.colors.primary} />
                <Text style={[styles.detailsInfoText, { color: theme.colors.text }]}>
                  {new Date(event.time).toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailsInfoItem}>
                <Icon name="location-on" size={20} color={theme.colors.primary} />
                <Text style={[styles.detailsInfoText, { color: theme.colors.text }]}>{event.venue}</Text>
              </View>
              <View style={styles.detailsInfoItem}>
                <Icon name="category" size={20} color={theme.colors.primary} />
                <Text style={[styles.detailsInfoText, { color: theme.colors.text }]}>{event.category}</Text>
              </View>
              {event.organizer && (
                <View style={styles.detailsInfoItem}>
                  <Icon name="person" size={20} color={theme.colors.primary} />
                  <Text style={[styles.detailsInfoText, { color: theme.colors.text }]}>{event.organizer}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.detailsDescription, { color: theme.colors.text }]}>
              {event.description}
            </Text>
            {event.speakers && (
              <View style={styles.speakersSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Speakers</Text>
                {event.speakers.map((speaker, index) => (
                  <View key={index} style={[styles.speakerItem, { borderBottomColor: theme.colors.border }]}>
                    <Image source={{ uri: speaker.avatar || 'https://via.placeholder.com/150' }} style={styles.speakerAvatar} />
                    <View style={styles.speakerInfo}>
                      <Text style={[styles.speakerName, { color: theme.colors.text }]}>{speaker.name}</Text>
                      <Text style={[styles.speakerBio, { color: theme.colors.border }]}>{speaker.bio}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </AnimatedCard>
          <View style={styles.actionButtons}>
            {!registered ? (
              <GradientButton 
                title="Register for Event" 
                onPress={handleRegister} 
                style={{ marginBottom: 12 }} 
              />
            ) : !checkedIn ? (
              <GradientButton 
                title="Check In Now" 
                onPress={handleCheckIn} 
                style={{ marginBottom: 12 }} 
              />
            ) : (
              <GradientButton 
                title="Give Feedback" 
                onPress={handleFeedback} 
                style={{ marginBottom: 12 }} 
              />
            )}
            {registered && (
              <View style={styles.qrCodeContainer}>
                <Text style={[styles.qrCodeTitle, { color: theme.colors.text }]}>Your Event Ticket</Text>
                <View style={[styles.qrCodeCard, { backgroundColor: theme.colors.card }]}>
                  <QRCode 
                    value={`event_${event.id}_user_123`} 
                    size={200} 
                    color={theme.colors.text} 
                    backgroundColor={theme.colors.card} 
                  />
                  <Text style={[styles.qrCodeText, { color: theme.colors.text }]}>{event.name}</Text>
                  <Text style={[styles.qrCodeSubtext, { color: theme.colors.border }]}>
                    {new Date(event.time).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeedbackScreen({ route, navigation }) {
  const { event } = route.params;
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleSubmit = async () => {
    if (rating === 0) return alert('Please provide a rating');
    if (!feedback.trim()) return alert('Please provide feedback');
    setLoading(true);
    try {
      // Get current user data to include their avatar in feedback
      const currentEmail = await AsyncStorage.getItem('currentUser');
      const userData = await AsyncStorage.getItem(`user_${currentEmail}`);
      const user = userData ? JSON.parse(userData) : {};

      await axios.post(INTERACTION_API, {
        eventId: event.id,
        eventName: event.name,
        rating,
        feedback,
        timestamp: new Date().toISOString(),
        userAvatar: user.avatar || null // Include user's avatar in feedback
      });
      alert('Thank you for your feedback!');
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.feedbackContainer}>
        <AnimatedCard style={styles.feedbackCard}>
          <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>
            Rate & Review: {event.name}
          </Text>
          <View style={styles.ratingContainer}>
            <StarRating
              rating={rating}
              onChange={setRating}
              maxStars={5}
              starSize={40}
              color={theme.colors.primary}
              emptyColor={theme.colors.border}
            />
            <Text style={[styles.ratingText, { color: theme.colors.border }]}>
              {rating > 0 ? `You rated ${rating} star${rating > 1 ? 's' : ''}` : 'Tap to rate'}
            </Text>
          </View>
          <Text style={[styles.feedbackLabel, { color: theme.colors.text }]}>
            Your Feedback
          </Text>
          <TextInput
            style={[
              styles.feedbackInput, 
              { 
                color: theme.colors.text, 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
            placeholder="Share your experience..."
            placeholderTextColor={theme.colors.border}
            multiline
            numberOfLines={5}
            value={feedback}
            onChangeText={setFeedback}
          />
          <GradientButton 
            title={loading ? "Submitting..." : "Submit Feedback"} 
            onPress={handleSubmit} 
            disabled={loading} 
            style={{ marginTop: 20 }} 
          />
        </AnimatedCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsScreen({ navigation }) {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Only clear session info, not all user data
      await AsyncStorage.removeItem('currentUser');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.settingsContainer}>
        <AnimatedCard style={styles.settingsCard}>
          <Text style={[styles.settingsSectionTitle, { color: theme.colors.text }]}>
            Preferences
          </Text>
          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingText}>
              <Icon name="notifications" size={20} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          </View>
          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingText}>
              <Icon name={isDarkMode ? "nights-stay" : "wb-sunny"} size={20} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          </View>
        </AnimatedCard>
        <AnimatedCard style={styles.settingsCard}>
          <Text style={[styles.settingsSectionTitle, { color: theme.colors.text }]}>
            Account
          </Text>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.settingText}>
              <Icon name="person" size={20} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Edit Profile
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.colors.border} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.navigate('RegisteredEvents')}
          >
            <View style={styles.settingText}>
              <Icon name="event" size={20} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                My Events
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.colors.border} />
          </TouchableOpacity>
        </AnimatedCard>
        <AnimatedCard style={styles.settingsCard}>
          <Text style={[styles.settingsSectionTitle, { color: theme.colors.text }]}>
            About
          </Text>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => alert('App version 1.0.0')}
          >
            <View style={styles.settingText}>
              <Icon name="info" size={20} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Version
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.colors.border }]}>1.0.0</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => Linking.openURL('https://example.com/terms')}
          >
            <View style={styles.settingText}>
              <Icon name="description" size={20} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Terms of Service
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.colors.border} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => Linking.openURL('https://example.com/privacy')}
          >
            <View style={styles.settingText}>
              <Icon name="privacy-tip" size={20} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Privacy Policy
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.colors.border} />
          </TouchableOpacity>
        </AnimatedCard>
        <GradientButton 
          title={loading ? "Logging Out..." : "Logout"} 
          onPress={handleLogout} 
          disabled={loading} 
          style={{ marginTop: 20 }} 
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// Main Tab Navigator
function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'event' : 'event-available';
          } else if (route.name === 'RegisteredEvents') {
            iconName = focused ? 'bookmark' : 'bookmark-border';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-none';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.tabIconActive,
        tabBarInactiveTintColor: theme.colors.tabIconInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Events' }} />
      <Tab.Screen 
        name="RegisteredEvents" 
        component={RegisteredEventsScreen} 
        options={{ title: 'My Events' }} 
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ tabBarBadge: 3 }} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// App Navigation Stack
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Details" component={EventDetailsScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

// Styles
// ...all your imports and code above remain unchanged...

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerGrad: {
    width: '100%',
    height: height * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: { alignItems: 'center' },
  appTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 10 },
  appSubtitle: { fontSize: 14, color: 'white', opacity: 0.8 },
  formContainer: { flex: 1, paddingHorizontal: 20, marginTop: -30, width: '100%' },
  registerFormContainer: { paddingHorizontal: 20, paddingBottom: 20, width: '100%', flexGrow: 1 },
  loginCard: { padding: 25, borderRadius: 15, marginBottom: 20, width: '100%' },
  formTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  formSubtitle: { fontSize: 14, marginBottom: 20 },
  inputCont: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, height: 50, width: '100%' },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, height: '100%', fontSize: 16 },
  gradBtn: { borderRadius: 10, overflow: 'hidden', height: 50, width: '100%' },
  gradBtnInner: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  gradBtnTxt: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  disBtn: { opacity: 0.7 },
  linkButton: { alignSelf: 'center' },
  linkText: { fontSize: 14 },
  linkTextBold: { fontWeight: 'bold' },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    width: '100%',
    minWidth: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    width: '100%',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  filtersContainer: { width: '100%', padding: 16, borderBottomWidth: 1 },
  filtersRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  pickerContainer: { width: '48%', borderRadius: 8, borderWidth: 1 },
  pickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8 },
  pickerTxt: { fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { marginHorizontal: 20, borderRadius: 12, maxHeight: height * 0.6, width: '90%', alignSelf: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', padding: 16, borderBottomWidth: 1 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalItemTxt: { fontSize: 16 },
  modalClose: { padding: 16, borderRadius: 8, margin: 16, alignItems: 'center' },
  modalCloseTxt: { color: 'white', fontWeight: 'bold' },
  eventCard: { flexDirection: 'row', marginBottom: 16, minHeight: 110, width: '100%' },
  eventImage: { width: 100, height: 100, borderRadius: 8 },
  eventContent: { flex: 1, marginLeft: 12, minWidth: 0 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  eventTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, minWidth: 0 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 8, alignSelf: 'flex-start' },
  categoryText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  eventDetails: { marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  eventTime: { fontSize: 12, marginLeft: 4 },
  eventVenue: { fontSize: 12, marginLeft: 4 },
  eventDescription: { fontSize: 13, lineHeight: 18 },
  eventsList: { padding: 16, paddingBottom: 30, flexGrow: 1, width: '100%' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, width: '100%' },
  emptyStateTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  emptyStateSubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  loadingText: { fontSize: 16 },
  profileContainer: { padding: 16, width: '100%', flexGrow: 1 },
  profileCard: { marginBottom: 16, width: '100%' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, marginRight: 16 },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  profileEmail: { fontSize: 14 },
  profileDetails: { marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  detailLabel: { fontSize: 14, marginLeft: 12, marginRight: 8 },
  detailValue: { fontSize: 14, fontWeight: 'bold', flex: 1, textAlign: 'right' },
  profileActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  profileActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, width: '48%' },
  profileActionText: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  statsCard: { padding: 16, width: '100%' },
  statsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  statItem: { width: '48%', borderRadius: 8, padding: 16, marginBottom: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  statLabel: { fontSize: 12 },
  notificationCard: { padding: 16, marginBottom: 12, width: '100%' },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  notificationTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  notificationTime: { fontSize: 12 },
  notificationMessage: { fontSize: 14, lineHeight: 20 },
  notificationsList: { padding: 16, width: '100%' },
  detailsEventImage: { width: '100%', height: 200 },
  detailsContent: { padding: 16, width: '100%' },
  detailsCard: { marginBottom: 16, width: '100%' },
  detailsTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  detailsInfo: { marginBottom: 16 },
  detailsInfoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailsInfoText: { fontSize: 14, marginLeft: 8 },
  detailsDescription: { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  speakersSection: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  speakerItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1 },
  speakerAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  speakerInfo: { flex: 1, justifyContent: 'center' },
  speakerName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  speakerBio: { fontSize: 12 },
  actionButtons: { marginBottom: 20, width: '100%' },
  qrCodeContainer: { alignItems: 'center', marginTop: 20, width: '100%' },
  qrCodeTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  qrCodeCard: { padding: 20, borderRadius: 12, alignItems: 'center', width: 240, alignSelf: 'center' },
  qrCodeText: { fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  qrCodeSubtext: { fontSize: 12, marginTop: 4 },
  feedbackContainer: { padding: 16, width: '100%', flexGrow: 1 },
  feedbackCard: { padding: 20, width: '100%' },
  feedbackTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  ratingContainer: { alignItems: 'center', marginBottom: 20, width: '100%' },
  ratingText: { fontSize: 14, marginTop: 8 },
  feedbackLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  feedbackInput: { height: 120, borderWidth: 1, borderRadius: 8, padding: 12, textAlignVertical: 'top', width: '100%' },
  settingsContainer: { padding: 16, width: '100%', flexGrow: 1 },
  settingsCard: { marginBottom: 16, width: '100%' },
  settingsSectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, width: '100%' },
  settingText: { flexDirection: 'row', alignItems: 'center' },
  settingLabel: { fontSize: 16, marginLeft: 12 },
  settingValue: { fontSize: 14 },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  uploadButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: 120,
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  recommendationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    width: '100%',
  },
  recommendationBarTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 5
  },
  recommendationBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  recommendationBtnText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  recommendationSection: {
    marginBottom: 10,
    width: '100%',
  },
  recommendationSectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  recommendationCard: {
    width: 170,
    padding: 0,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recommendationImage: {
    width: 170,
    height: 90,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  recommendationCardContent: {
    padding: 10,
  },
  recommendationCardTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  recommendationCardVenue: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  recommendationCardDate: {
    color: '#aaa',
    fontSize: 12,
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <AppStack />
      </NavigationContainer>
    </ThemeProvider>
  );
}