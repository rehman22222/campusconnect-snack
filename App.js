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
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

// Responsive scaling functions
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

const isSmallScreen = width < 375;
const isLargeScreen = width > 768;

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
    <View style={{ width: '100%' }}>
      <TouchableOpacity 
        style={[styles.pickerBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }, style]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.pickerTxt, { color: theme.colors.text }]} numberOfLines={1}>
          {selectedItem ? selectedItem.label : 'Select...'}
        </Text>
        <Icon name="arrow-drop-down" size={moderateScale(20)} color={theme.colors.text} />
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card, maxHeight: height * 0.7 }]}>
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
                  {selectedValue === item.value && <Icon name="check" size={moderateScale(20)} color={theme.colors.primary} />}
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
    AsyncStorage.getItem('darkTheme').then(saved => {
      if (saved !== null) {
        setIsDarkMode(saved === 'true');
      }
    }).catch(console.log); 
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

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

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
      {icon && <Icon name={icon} size={moderateScale(20)} color={theme.colors.border} style={styles.inputIcon} />}
      <TextInput 
        placeholder={placeholder} 
        value={value} 
        onChangeText={onChangeText} 
        secureTextEntry={secureTextEntry} 
        style={[styles.textInput, { color: theme.colors.text, fontSize: moderateScale(16) }]} 
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
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try { 
      const stored = await AsyncStorage.getItem(`user_${email}`); 
      if (stored && JSON.parse(stored).password === password) { 
        await AsyncStorage.setItem('currentUser', email);
        navigation.replace('Main', { userEmail: email }); 
      } else {
        Alert.alert('Error', 'Invalid credentials'); 
      }
    } catch { 
      Alert.alert('Error', 'Login failed. Please try again.'); 
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <LinearGradient colors={theme.colors.gradient} style={styles.headerGrad}>
        <View style={styles.logoContainer}>
          <Icon name="school" size={moderateScale(60)} color="white" />
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
            style={{ marginBottom: verticalScale(16) }} 
          />
          <CustomInput 
            placeholder="Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            icon="lock" 
            style={{ marginBottom: verticalScale(24) }} 
          />
          <GradientButton 
            title={loading ? "Signing In..." : "Sign In"} 
            onPress={login} 
            disabled={loading} 
            style={{ marginBottom: verticalScale(16) }} 
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
    if (!email || !password || !confirmPassword || !name || !studentId || !department || !semester) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try { 
      await AsyncStorage.setItem(`user_${email}`, JSON.stringify({ 
        email, 
        password, 
        name, 
        studentId, 
        department, 
        semester,
        avatar: null
      }));
      await AsyncStorage.setItem('currentUser', email);
      Alert.alert('Success', 'Account created! 🎉'); 
      navigation.replace('Main', { userEmail: email });
    } catch { 
      Alert.alert('Error', 'Registration failed.'); 
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
            <Icon name="person-add" size={moderateScale(60)} color="white" />
            <Text style={styles.appTitle}>Join Us</Text>
            <Text style={styles.appSubtitle}>Create your account</Text>
          </View>
        </LinearGradient>
        <ScrollView 
          contentContainerStyle={styles.registerFormContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AnimatedCard style={styles.loginCard}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Create Account</Text>
            <CustomInput placeholder="Full Name" value={name} onChangeText={setName} icon="person" style={{ marginBottom: verticalScale(16) }} />
            <CustomInput placeholder="Student ID" value={studentId} onChangeText={setStudentId} icon="badge" style={{ marginBottom: verticalScale(16) }} />
            <CustomInput placeholder="Department" value={department} onChangeText={setDepartment} icon="school" style={{ marginBottom: verticalScale(16) }} />
            <CustomInput placeholder="Semester" value={semester} onChangeText={setSemester} icon="class" style={{ marginBottom: verticalScale(16) }} />
            <CustomInput placeholder="Email" value={email} onChangeText={setEmail} icon="email" style={{ marginBottom: verticalScale(16) }} />
            <CustomInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry icon="lock" style={{ marginBottom: verticalScale(16) }} />
            <CustomInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry icon="lock" style={{ marginBottom: verticalScale(24) }} />
            <GradientButton title={loading ? "Creating..." : "Create Account"} onPress={register} disabled={loading} style={{ marginBottom: verticalScale(16) }} />
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

// RecommendationBar Component
const RecommendationBar = ({ events, selectedCategory, selectedSort, onCategoryPress, onSortPress }) => {
  const { theme } = useTheme();
  
  // Get unique categories from events
  const categories = ['All', ...new Set(events.map(e => e.category).filter(Boolean))];
  const sortOptions = [
    { label: 'Newest', value: 'Newest' },
    { label: 'Alphabetical', value: 'Alphabetical' }
  ];

  return (
    <View style={styles.recommendationBar}>
      <Text style={[styles.recommendationBarTitle, { color: theme.colors.text }]}>Recommended: </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.recommendationScroll}
      >
        <View style={styles.recommendationButtons}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.recommendationBtn,
                {
                  backgroundColor: selectedCategory === cat ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.primary,
                }
              ]}
              onPress={() => onCategoryPress(cat)}
            >
              <Text style={[
                styles.recommendationBtnText,
                { color: selectedCategory === cat ? 'white' : theme.colors.primary }
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
          {sortOptions.map(sort => (
            <TouchableOpacity
              key={sort.value}
              style={[
                styles.recommendationBtn,
                {
                  backgroundColor: selectedSort === sort.value ? theme.colors.accent : theme.colors.surface,
                  borderColor: theme.colors.accent,
                }
              ]}
              onPress={() => onSortPress(sort.value)}
            >
              <Text style={[
                styles.recommendationBtnText,
                { color: selectedSort === sort.value ? 'white' : theme.colors.accent }
              ]}>
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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

  useEffect(() => { 
    const fetchData = async () => {
      try {
        const [eventsResponse, allKeys] = await Promise.all([
          axios.get(EVENTS_API),
          AsyncStorage.getAllKeys()
        ]);
        
        const eventsWithImages = eventsResponse.data.map(event => ({
          ...event,
          image: event.image || 'https://via.placeholder.com/400x200?text=Event+Image'
        }));
        
        setEvents(eventsWithImages);
        
        const regKeys = allKeys.filter(key => key.startsWith('reg_'));
        setRegisteredEventIds(regKeys.map(key => key.replace('reg_', '')));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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

  // Recommended events
  const recommendedEvents = events.filter(
    e => mostFrequentCategory && e.category === mostFrequentCategory && !registeredEventIds.includes(e.id.toString())
  ).slice(0, 5);

  // Filter and sort events
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
          <Icon name="settings" size={moderateScale(24)} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.filtersContainer, { backgroundColor: theme.colors.surface }]}>
          <CustomInput 
            placeholder="Search events..." 
            value={search} 
            onChangeText={setSearch} 
            icon="search" 
            style={{ marginBottom: verticalScale(12) }} 
          />
          
          <RecommendationBar
            events={events}
            selectedCategory={category}
            selectedSort={sort}
            onCategoryPress={setCategory}
            onSortPress={setSort}
          />
          
          {mostFrequentCategory && recommendedEvents.length > 0 && (
            <View style={styles.recommendationSection}>
              <Text style={[styles.recommendationSectionTitle, { color: theme.colors.text }]}>
                Recommended for you ({mostFrequentCategory})
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.recommendationScrollView}
              >
                {recommendedEvents.map(ev => (
                  <TouchableOpacity 
                    key={ev.id} 
                    onPress={() => navigation.navigate('Details', { event: ev })}
                    style={styles.recommendationCardContainer}
                  >
                    <AnimatedCard style={styles.recommendationCard}>
                      <Image 
                        source={{ uri: ev.image }} 
                        style={styles.recommendationImage} 
                      />
                      <View style={styles.recommendationCardContent}>
                        <Text style={[styles.recommendationCardTitle, { color: theme.colors.text }]} numberOfLines={2}>
                          {ev.name}
                        </Text>
                        <Text style={[styles.recommendationCardVenue, { color: theme.colors.border }]} numberOfLines={1}>
                          {ev.venue}
                        </Text>
                        <Text style={[styles.recommendationCardDate, { color: theme.colors.border }]}>
                          {new Date(ev.time).toLocaleDateString()}
                        </Text>
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
                <CustomPicker.Item label="Other" value="Other" />
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
          <View style={styles.eventsListContainer}>
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  onPress={() => navigation.navigate('Details', { event: item })} 
                  activeOpacity={0.9}
                  style={styles.eventCardContainer}
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
                          <Icon name="calendar-today" size={moderateScale(16)} color={theme.colors.border} />
                          <Text style={[styles.eventTime, { color: theme.colors.border }]}>
                            {new Date(item.time).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Icon name="location-on" size={moderateScale(16)} color={theme.colors.border} />
                          <Text style={[styles.eventVenue, { color: theme.colors.border }]} numberOfLines={1}>
                            {item.venue}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.eventDescription, { color: theme.colors.text }]} numberOfLines={3}>
                        {item.description}
                      </Text>
                    </View>
                  </AnimatedCard>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="search-off" size={moderateScale(48)} color={theme.colors.border} />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No events found</Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.colors.border }]}>
                  Try adjusting your search criteria
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
        const [eventsResponse, allKeys] = await Promise.all([
          axios.get(EVENTS_API),
          AsyncStorage.getAllKeys()
        ]);
        
        const eventsWithImages = eventsResponse.data.map(event => ({
          ...event,
          image: event.image || 'https://via.placeholder.com/400x200?text=Event+Image'
        }));
        
        setEvents(eventsWithImages);
        
        const regKeys = allKeys.filter(key => key.startsWith('reg_'));
        const regEventIds = regKeys.map(key => key.replace('reg_', ''));
        
        const filtered = eventsWithImages.filter(event => 
          regEventIds.includes(event.id.toString())
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
              style={styles.eventCardContainer}
            >
              <AnimatedCard style={styles.eventCard}>
                <Image source={{ uri: item.image }} style={styles.eventImage} />
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
                      <Icon name="calendar-today" size={moderateScale(16)} color={theme.colors.border} />
                      <Text style={[styles.eventTime, { color: theme.colors.border }]}>
                        {new Date(item.time).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name="location-on" size={moderateScale(16)} color={theme.colors.border} />
                      <Text style={[styles.eventVenue, { color: theme.colors.border }]} numberOfLines={1}>
                        {item.venue}
                      </Text>
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
          <Icon name="event-busy" size={moderateScale(48)} color={theme.colors.border} />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No registered events</Text>
          <Text style={[styles.emptyStateSubtitle, { color: theme.colors.border }]}>
            Register for events to see them here
          </Text>
          <GradientButton 
            title="Browse Events" 
            onPress={() => navigation.navigate('Home')} 
            style={{ marginTop: verticalScale(20) }} 
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
              !item.read && { borderLeftWidth: moderateScale(4), borderLeftColor: theme.colors.primary }
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
          <Icon name="notifications-off" size={moderateScale(48)} color={theme.colors.border} />
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
        console.error('Error loading user:', e);
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
          <Icon name="settings" size={moderateScale(24)} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading profile...</Text>
        </View>
      ) : user ? (
        <ScrollView 
          contentContainerStyle={styles.profileContainer} 
          showsVerticalScrollIndicator={false}
        >
          <AnimatedCard style={styles.profileCard}>
            <View style={styles.profileHeader}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.profileAvatar} />
              ) : (
                <View style={[styles.profileAvatar, { backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                  <Icon name="person" size={moderateScale(40)} color={theme.colors.card} />
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.colors.text }]} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={[styles.profileEmail, { color: theme.colors.border }]} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            </View>
            <View style={styles.profileDetails}>
              <View style={[styles.detailItem, { borderBottomColor: theme.colors.border }]}>
                <Icon name="badge" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Student ID:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]} numberOfLines={1}>
                  {user.studentId}
                </Text>
              </View>
              <View style={[styles.detailItem, { borderBottomColor: theme.colors.border }]}>
                <Icon name="school" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Department:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]} numberOfLines={1}>
                  {user.department}
                </Text>
              </View>
              <View style={[styles.detailItem, { borderBottomColor: theme.colors.border }]}>
                <Icon name="class" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Semester:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]} numberOfLines={1}>
                  {user.semester}
                </Text>
              </View>
            </View>
            <View style={styles.profileActions}>
              <TouchableOpacity 
                style={[styles.profileActionBtn, { backgroundColor: theme.colors.surface }]}
                onPress={() => navigation.navigate('EditProfile', { user })}
              >
                <Icon name="edit" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={[styles.profileActionText, { color: theme.colors.primary }]} numberOfLines={1}>
                  Edit Profile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.profileActionBtn, { backgroundColor: theme.colors.surface }]}
                onPress={toggleTheme}
              >
                <Icon 
                  name={isDarkMode ? "wb-sunny" : "nights-stay"} 
                  size={moderateScale(20)} 
                  color={theme.colors.primary} 
                />
                <Text style={[styles.profileActionText, { color: theme.colors.primary }]} numberOfLines={1}>
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>
          <AnimatedCard style={styles.statsCard}>
            <Text style={[styles.statsTitle, { color: theme.colors.text }]}>My Activity</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
                <Icon name="event" size={moderateScale(24)} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>12</Text>
                <Text style={[styles.statLabel, { color: theme.colors.border }]}>Events</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
                <Icon name="check-circle" size={moderateScale(24)} color={theme.colors.success} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>8</Text>
                <Text style={[styles.statLabel, { color: theme.colors.border }]}>Attended</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
                <Icon name="star" size={moderateScale(24)} color={theme.colors.warning} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>4.8</Text>
                <Text style={[styles.statLabel, { color: theme.colors.border }]}>Avg Rating</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
                <Icon name="forum" size={moderateScale(24)} color={theme.colors.accent} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>15</Text>
                <Text style={[styles.statLabel, { color: theme.colors.border }]}>Feedbacks</Text>
              </View>
            </View>
          </AnimatedCard>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="person-off" size={moderateScale(48)} color={theme.colors.border} />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No user data</Text>
          <Text style={[styles.emptyStateSubtitle, { color: theme.colors.border }]}>
            Please log in again.
          </Text>
          <GradientButton 
            title="Go to Login" 
            onPress={() => navigation.replace('Login')} 
            style={{ marginTop: verticalScale(20) }} 
          />
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
          setEmail(currentEmail || '');
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
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    getUser();
  }, [route.params]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permission required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    if (!name || !studentId || !department || !semester) {
      Alert.alert('Missing Information', 'Please fill out all required fields.');
      return;
    }
    
    if (!email) {
      Alert.alert('Error', 'Cannot find user email. Please log in again.');
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
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert("Error", "Could not update profile.");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView 
        contentContainerStyle={styles.editProfileContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.headerContainer, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={moderateScale(24)} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Edit Profile</Text>
          <View style={{ width: moderateScale(24) }} />
        </View>
        
        <View style={styles.profileEditContainer}>
          <AnimatedCard style={styles.profileCard}>
            <Text style={[styles.formTitle, { color: theme.colors.text, textAlign: 'center', marginBottom: verticalScale(20) }]}>
              Edit Your Profile
            </Text>
            
            <View style={styles.avatarContainer}>
              {image ? (
                <Image source={{ uri: image }} style={styles.profileAvatar} />
              ) : (
                <View style={[
                  styles.profileAvatar, 
                  { 
                    backgroundColor: theme.colors.border,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }
                ]}>
                  <Icon name="person" size={moderateScale(40)} color={theme.colors.card} />
                </View>
              )}
              <TouchableOpacity 
                onPress={pickImage} 
                style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.uploadButtonText}>Choose Photo</Text>
              </TouchableOpacity>
            </View>
            
            <CustomInput 
              placeholder="Full Name" 
              value={name} 
              onChangeText={setName} 
              icon="person" 
              style={{ marginBottom: verticalScale(16) }} 
            />
            <CustomInput 
              placeholder="Student ID" 
              value={studentId} 
              onChangeText={setStudentId} 
              icon="badge" 
              style={{ marginBottom: verticalScale(16) }} 
            />
            <CustomInput 
              placeholder="Department" 
              value={department} 
              onChangeText={setDepartment} 
              icon="school" 
              style={{ marginBottom: verticalScale(16) }} 
            />
            <CustomInput 
              placeholder="Semester" 
              value={semester} 
              onChangeText={setSemester} 
              icon="class" 
              style={{ marginBottom: verticalScale(16) }} 
            />
            
            <GradientButton
              title={loading ? "Saving..." : "Save Changes"}
              onPress={saveProfile}
              disabled={loading}
              style={{ marginTop: verticalScale(10) }}
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
      Alert.alert('Success', 'Successfully registered for this event!');
    } catch (error) {
      console.error('Error registering:', error);
      Alert.alert('Error', 'Failed to register for the event. Please try again.');
    }
  };

  const handleCheckIn = () => {
    setCheckedIn(true);
    Alert.alert('Success', 'Check-in confirmed! Enjoy the event.');
  };

  const handleFeedback = () => {
    navigation.navigate('Feedback', { event });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.detailsScrollContent}
      >
        <Image 
          source={{ uri: event.image || 'https://via.placeholder.com/400x200?text=Event+Image' }} 
          style={[styles.detailsEventImage, { height: height * 0.3 }]} 
        />
        <View style={styles.detailsContent}>
          <AnimatedCard style={styles.detailsCard}>
            <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>{event.name}</Text>
            <View style={styles.detailsInfo}>
              <View style={styles.detailsInfoItem}>
                <Icon name="calendar-today" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={[styles.detailsInfoText, { color: theme.colors.text }]}>
                  {new Date(event.time).toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailsInfoItem}>
                <Icon name="location-on" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={[styles.detailsInfoText, { color: theme.colors.text }]} numberOfLines={1}>
                  {event.venue}
                </Text>
              </View>
              <View style={styles.detailsInfoItem}>
                <Icon name="category" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={[styles.detailsInfoText, { color: theme.colors.text }]}>
                  {event.category || 'General'}
                </Text>
              </View>
              {event.organizer && (
                <View style={styles.detailsInfoItem}>
                  <Icon name="person" size={moderateScale(20)} color={theme.colors.primary} />
                  <Text style={[styles.detailsInfoText, { color: theme.colors.text }]} numberOfLines={1}>
                    {event.organizer}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.detailsDescription, { color: theme.colors.text }]}>
              {event.description || 'No description available.'}
            </Text>
            
            {event.speakers && event.speakers.length > 0 && (
              <View style={styles.speakersSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Speakers</Text>
                {event.speakers.map((speaker, index) => (
                  <View key={index} style={[styles.speakerItem, { borderBottomColor: theme.colors.border }]}>
                    <Image 
                      source={{ uri: speaker.avatar || 'https://via.placeholder.com/150' }} 
                      style={styles.speakerAvatar} 
                    />
                    <View style={styles.speakerInfo}>
                      <Text style={[styles.speakerName, { color: theme.colors.text }]}>{speaker.name}</Text>
                      <Text style={[styles.speakerBio, { color: theme.colors.border }]} numberOfLines={2}>
                        {speaker.bio}
                      </Text>
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
                style={{ marginBottom: verticalScale(12) }} 
              />
            ) : !checkedIn ? (
              <GradientButton 
                title="Check In Now" 
                onPress={handleCheckIn} 
                style={{ marginBottom: verticalScale(12) }} 
              />
            ) : (
              <GradientButton 
                title="Give Feedback" 
                onPress={handleFeedback} 
                style={{ marginBottom: verticalScale(12) }} 
              />
            )}
            
            {registered && (
              <View style={styles.qrCodeContainer}>
                <Text style={[styles.qrCodeTitle, { color: theme.colors.text }]}>Your Event Ticket</Text>
                <View style={[styles.qrCodeCard, { backgroundColor: theme.colors.card }]}>
                  <QRCode 
                    value={`event_${event.id}_user_${Date.now()}`} 
                    size={width * 0.5} 
                    color={theme.colors.text} 
                    backgroundColor={theme.colors.card} 
                  />
                  <Text style={[styles.qrCodeText, { color: theme.colors.text }]} numberOfLines={2}>
                    {event.name}
                  </Text>
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
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating');
      return;
    }
    if (!feedback.trim()) {
      Alert.alert('Feedback Required', 'Please provide feedback');
      return;
    }
    
    setLoading(true);
    try {
      const currentEmail = await AsyncStorage.getItem('currentUser');
      const userData = await AsyncStorage.getItem(`user_${currentEmail}`);
      const user = userData ? JSON.parse(userData) : {};

      await axios.post(INTERACTION_API, {
        eventId: event.id,
        eventName: event.name,
        rating,
        feedback,
        timestamp: new Date().toISOString(),
        userAvatar: user.avatar || null
      });
      
      Alert.alert('Thank You!', 'Thank you for your feedback!');
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView 
        contentContainerStyle={styles.feedbackContainer}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedCard style={styles.feedbackCard}>
          <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>
            Rate & Review: {event.name}
          </Text>
          
          <View style={styles.ratingContainer}>
            <StarRating
              rating={rating}
              onChange={setRating}
              maxStars={5}
              starSize={moderateScale(40)}
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
            textAlignVertical="top"
          />
          
          <GradientButton 
            title={loading ? "Submitting..." : "Submit Feedback"} 
            onPress={handleSubmit} 
            disabled={loading} 
            style={{ marginTop: verticalScale(20) }} 
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
      await AsyncStorage.removeItem('currentUser');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: moderateScale(24) }} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.settingsContainer}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedCard style={styles.settingsCard}>
          <Text style={[styles.settingsSectionTitle, { color: theme.colors.text }]}>
            Preferences
          </Text>
          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingText}>
              <Icon name="notifications" size={moderateScale(20)} color={theme.colors.primary} />
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
              <Icon name={isDarkMode ? "nights-stay" : "wb-sunny"} size={moderateScale(20)} color={theme.colors.primary} />
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
              <Icon name="person" size={moderateScale(20)} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Edit Profile
              </Text>
            </View>
            <Icon name="chevron-right" size={moderateScale(20)} color={theme.colors.border} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.navigate('RegisteredEvents')}
          >
            <View style={styles.settingText}>
              <Icon name="event" size={moderateScale(20)} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                My Events
              </Text>
            </View>
            <Icon name="chevron-right" size={moderateScale(20)} color={theme.colors.border} />
          </TouchableOpacity>
        </AnimatedCard>
        
        <AnimatedCard style={styles.settingsCard}>
          <Text style={[styles.settingsSectionTitle, { color: theme.colors.text }]}>
            About
          </Text>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => Alert.alert('App Version', 'CampusConnect v1.0.0')}
          >
            <View style={styles.settingText}>
              <Icon name="info" size={moderateScale(20)} color={theme.colors.primary} />
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
              <Icon name="description" size={moderateScale(20)} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Terms of Service
              </Text>
            </View>
            <Icon name="chevron-right" size={moderateScale(20)} color={theme.colors.border} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => Linking.openURL('https://example.com/privacy')}
          >
            <View style={styles.settingText}>
              <Icon name="privacy-tip" size={moderateScale(20)} color={theme.colors.primary} />
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Privacy Policy
              </Text>
            </View>
            <Icon name="chevron-right" size={moderateScale(20)} color={theme.colors.border} />
          </TouchableOpacity>
        </AnimatedCard>
        
        <GradientButton 
          title={loading ? "Logging Out..." : "Logout"} 
          onPress={handleLogout} 
          disabled={loading} 
          style={{ marginTop: verticalScale(20), marginBottom: verticalScale(20) }} 
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
          return <Icon name={iconName} size={moderateScale(size)} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.tabIconActive,
        tabBarInactiveTintColor: theme.colors.tabIconInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          height: verticalScale(60),
          paddingBottom: moderateScale(5),
          paddingTop: moderateScale(5),
        },
        tabBarLabelStyle: {
          fontSize: moderateScale(12),
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

// Responsive Styles
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
    width: '100%',
  },
  headerGrad: {
    width: '100%',
    height: verticalScale(200),
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: moderateScale(30),
    borderBottomRightRadius: moderateScale(30),
  },
  logoContainer: { 
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  appTitle: { 
    fontSize: moderateScale(28), 
    fontWeight: 'bold', 
    color: 'white', 
    marginTop: verticalScale(10),
    textAlign: 'center',
  },
  appSubtitle: { 
    fontSize: moderateScale(14), 
    color: 'white', 
    opacity: 0.8,
    marginTop: verticalScale(5),
    textAlign: 'center',
  },
  formContainer: { 
    flex: 1, 
    paddingHorizontal: moderateScale(20), 
    marginTop: verticalScale(-30), 
    width: '100%',
    alignItems: 'center',
  },
  registerFormContainer: { 
    paddingHorizontal: moderateScale(20), 
    paddingBottom: verticalScale(20), 
    width: '100%', 
    flexGrow: 1,
    alignItems: 'center',
  },
  loginCard: { 
    padding: moderateScale(25), 
    borderRadius: moderateScale(15), 
    marginBottom: verticalScale(20), 
    width: '100%',
    maxWidth: moderateScale(400),
    alignSelf: 'center',
  },
  formTitle: { 
    fontSize: moderateScale(24), 
    fontWeight: 'bold', 
    marginBottom: verticalScale(5),
  },
  formSubtitle: { 
    fontSize: moderateScale(14), 
    marginBottom: verticalScale(20),
  },
  inputCont: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: moderateScale(10), 
    paddingHorizontal: moderateScale(15), 
    height: verticalScale(50), 
    width: '100%',
  },
  inputIcon: { 
    marginRight: moderateScale(10),
  },
  textInput: { 
    flex: 1, 
    height: '100%', 
    fontSize: moderateScale(16),
  },
  gradBtn: { 
    borderRadius: moderateScale(10), 
    overflow: 'hidden', 
    height: verticalScale(50), 
    width: '100%',
  },
  gradBtnInner: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: '100%',
  },
  gradBtnTxt: { 
    color: 'white', 
    fontSize: moderateScale(16), 
    fontWeight: 'bold',
  },
  disBtn: { 
    opacity: 0.7,
  },
  linkButton: { 
    alignSelf: 'center',
  },
  linkText: { 
    fontSize: moderateScale(14),
  },
  linkTextBold: { 
    fontWeight: 'bold',
  },
  card: {
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
    borderWidth: 1,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    width: '100%',
    minHeight: verticalScale(60),
  },
  headerTitle: { 
    fontSize: moderateScale(20), 
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: moderateScale(10),
  },
  filtersContainer: { 
    width: '100%', 
    padding: moderateScale(16), 
    borderBottomWidth: 1,
  },
  filtersRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%',
    flexWrap: isSmallScreen ? 'wrap' : 'nowrap',
  },
  pickerContainer: { 
    width: isSmallScreen ? '100%' : '48%', 
    borderRadius: moderateScale(8), 
    borderWidth: 1,
    marginBottom: isSmallScreen ? moderateScale(10) : 0,
  },
  pickerBtn: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: moderateScale(12), 
    borderRadius: moderateScale(8),
    minHeight: verticalScale(50),
  },
  pickerTxt: { 
    fontSize: moderateScale(14),
    flex: 1,
    marginRight: moderateScale(10),
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: { 
    marginHorizontal: moderateScale(20), 
    borderRadius: moderateScale(12), 
    maxHeight: height * 0.6, 
    width: moderateScale(335),
    alignSelf: 'center',
  },
  modalTitle: { 
    fontSize: moderateScale(18), 
    fontWeight: 'bold', 
    padding: moderateScale(16), 
    borderBottomWidth: 1,
  },
  modalItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: moderateScale(16), 
    borderBottomWidth: 1,
    minHeight: verticalScale(50),
  },
  modalItemTxt: { 
    fontSize: moderateScale(16),
    flex: 1,
  },
  modalClose: { 
    padding: moderateScale(16), 
    borderRadius: moderateScale(8), 
    margin: moderateScale(16), 
    alignItems: 'center',
  },
  modalCloseTxt: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: moderateScale(16),
  },
  eventCard: { 
    flexDirection: isSmallScreen ? 'column' : 'row', 
    marginBottom: moderateScale(16),
    width: '100%',
    overflow: 'hidden',
  },
  eventImage: { 
    width: isSmallScreen ? '100%' : moderateScale(100), 
    height: isSmallScreen ? verticalScale(150) : moderateScale(100), 
    borderRadius: moderateScale(8),
  },
  eventContent: { 
    flex: 1, 
    marginLeft: isSmallScreen ? 0 : moderateScale(12),
    marginTop: isSmallScreen ? moderateScale(12) : 0,
  },
  eventHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: moderateScale(8),
    flexWrap: 'wrap',
  },
  eventTitle: { 
    fontSize: moderateScale(16), 
    fontWeight: 'bold', 
    flex: 1,
    marginRight: moderateScale(8),
  },
  categoryBadge: { 
    paddingHorizontal: moderateScale(8), 
    paddingVertical: moderateScale(4), 
    borderRadius: moderateScale(4), 
    alignSelf: 'flex-start',
    marginTop: moderateScale(2),
  },
  categoryText: { 
    color: 'white', 
    fontSize: moderateScale(12), 
    fontWeight: 'bold',
  },
  eventDetails: { 
    marginBottom: moderateScale(8),
  },
  detailRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: moderateScale(4),
    flexWrap: 'wrap',
  },
  eventTime: { 
    fontSize: moderateScale(12), 
    marginLeft: moderateScale(4),
    flex: 1,
  },
  eventVenue: { 
    fontSize: moderateScale(12), 
    marginLeft: moderateScale(4),
    flex: 1,
  },
  eventDescription: { 
    fontSize: moderateScale(13), 
    lineHeight: moderateScale(18),
  },
  eventsList: { 
    padding: moderateScale(16), 
    paddingBottom: verticalScale(30),
    width: '100%',
  },
  eventsListContainer: {
    width: '100%',
    padding: moderateScale(16),
    paddingBottom: verticalScale(30),
  },
  eventCardContainer: {
    width: '100%',
    marginBottom: moderateScale(16),
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: moderateScale(40), 
    width: '100%',
    minHeight: verticalScale(300),
  },
  emptyStateTitle: { 
    fontSize: moderateScale(18), 
    fontWeight: 'bold', 
    marginTop: verticalScale(16), 
    textAlign: 'center',
  },
  emptyStateSubtitle: { 
    fontSize: moderateScale(14), 
    marginTop: moderateScale(8), 
    textAlign: 'center',
  },
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%',
    minHeight: verticalScale(200),
  },
  loadingText: { 
    fontSize: moderateScale(16),
  },
  profileContainer: { 
    padding: moderateScale(16), 
    width: '100%',
    alignItems: 'center',
  },
  profileCard: { 
    marginBottom: moderateScale(16), 
    width: '100%',
    maxWidth: moderateScale(400),
  },
  profileHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: verticalScale(20),
    width: '100%',
  },
  profileAvatar: { 
    width: moderateScale(80), 
    height: moderateScale(80), 
    borderRadius: moderateScale(40), 
    marginRight: moderateScale(16),
  },
  profileInfo: { 
    flex: 1,
  },
  profileName: { 
    fontSize: moderateScale(20), 
    fontWeight: 'bold', 
    marginBottom: moderateScale(4),
  },
  profileEmail: { 
    fontSize: moderateScale(14),
  },
  profileDetails: { 
    marginBottom: verticalScale(20),
    width: '100%',
  },
  detailItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: verticalScale(12), 
    borderBottomWidth: 1,
    width: '100%',
  },
  detailLabel: { 
    fontSize: moderateScale(14), 
    marginLeft: moderateScale(12), 
    marginRight: moderateScale(8),
    flex: 1,
  },
  detailValue: { 
    fontSize: moderateScale(14), 
    fontWeight: 'bold', 
    flex: 2,
    textAlign: 'right',
  },
  profileActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%',
    flexWrap: isSmallScreen ? 'wrap' : 'nowrap',
  },
  profileActionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: moderateScale(12), 
    borderRadius: moderateScale(8), 
    width: isSmallScreen ? '100%' : '48%',
    marginBottom: isSmallScreen ? moderateScale(10) : 0,
    justifyContent: 'center',
  },
  profileActionText: { 
    fontSize: moderateScale(14), 
    fontWeight: 'bold', 
    marginLeft: moderateScale(8),
  },
  statsCard: { 
    padding: moderateScale(16), 
    width: '100%',
    maxWidth: moderateScale(400),
  },
  statsTitle: { 
    fontSize: moderateScale(16), 
    fontWeight: 'bold', 
    marginBottom: moderateScale(16),
  },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    width: '100%',
  },
  statItem: { 
    width: isSmallScreen ? '48%' : '23%', 
    borderRadius: moderateScale(8), 
    padding: moderateScale(16), 
    marginBottom: moderateScale(16), 
    alignItems: 'center',
    minWidth: moderateScale(80),
  },
  statValue: { 
    fontSize: moderateScale(24), 
    fontWeight: 'bold', 
    marginVertical: verticalScale(8),
  },
  statLabel: { 
    fontSize: moderateScale(12),
    textAlign: 'center',
  },
  notificationCard: { 
    padding: moderateScale(16), 
    marginBottom: moderateScale(12), 
    width: '100%',
  },
  notificationHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: moderateScale(8),
    flexWrap: 'wrap',
  },
  notificationTitle: { 
    fontSize: moderateScale(16), 
    fontWeight: 'bold', 
    flex: 1,
    marginRight: moderateScale(8),
  },
  notificationTime: { 
    fontSize: moderateScale(12),
  },
  notificationMessage: { 
    fontSize: moderateScale(14), 
    lineHeight: moderateScale(20),
  },
  notificationsList: { 
    padding: moderateScale(16), 
    width: '100%',
  },
  detailsEventImage: { 
    width: '100%',
  },
  detailsContent: { 
    padding: moderateScale(16), 
    width: '100%',
    alignItems: 'center',
  },
  detailsCard: { 
    marginBottom: moderateScale(16), 
    width: '100%',
    maxWidth: moderateScale(400),
  },
  detailsTitle: { 
    fontSize: moderateScale(22), 
    fontWeight: 'bold', 
    marginBottom: verticalScale(16),
  },
  detailsInfo: { 
    marginBottom: verticalScale(16),
    width: '100%',
  },
  detailsInfoItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: moderateScale(8),
    flexWrap: 'wrap',
  },
  detailsInfoText: { 
    fontSize: moderateScale(14), 
    marginLeft: moderateScale(8),
    flex: 1,
  },
  detailsDescription: { 
    fontSize: moderateScale(14), 
    lineHeight: moderateScale(22), 
    marginBottom: verticalScale(16),
  },
  speakersSection: { 
    marginTop: verticalScale(16),
    width: '100%',
  },
  sectionTitle: { 
    fontSize: moderateScale(18), 
    fontWeight: 'bold', 
    marginBottom: moderateScale(12),
  },
  speakerItem: { 
    flexDirection: 'row', 
    paddingVertical: verticalScale(12), 
    borderBottomWidth: 1,
    width: '100%',
  },
  speakerAvatar: { 
    width: moderateScale(50), 
    height: moderateScale(50), 
    borderRadius: moderateScale(25), 
    marginRight: moderateScale(12),
  },
  speakerInfo: { 
    flex: 1, 
    justifyContent: 'center',
  },
  speakerName: { 
    fontSize: moderateScale(16), 
    fontWeight: 'bold', 
    marginBottom: moderateScale(4),
  },
  speakerBio: { 
    fontSize: moderateScale(12),
  },
  actionButtons: { 
    marginBottom: verticalScale(20), 
    width: '100%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
  },
  qrCodeContainer: { 
    alignItems: 'center', 
    marginTop: verticalScale(20), 
    width: '100%',
  },
  qrCodeTitle: { 
    fontSize: moderateScale(16), 
    fontWeight: 'bold', 
    marginBottom: moderateScale(12),
  },
  qrCodeCard: { 
    padding: moderateScale(20), 
    borderRadius: moderateScale(12), 
    alignItems: 'center', 
    width: '100%',
    maxWidth: moderateScale(300),
  },
  qrCodeText: { 
    fontSize: moderateScale(16), 
    fontWeight: 'bold', 
    marginTop: moderateScale(12),
    textAlign: 'center',
  },
  qrCodeSubtext: { 
    fontSize: moderateScale(12), 
    marginTop: moderateScale(4),
    textAlign: 'center',
  },
  feedbackContainer: { 
    padding: moderateScale(16), 
    width: '100%',
    alignItems: 'center',
    flexGrow: 1,
  },
  feedbackCard: { 
    padding: moderateScale(20), 
    width: '100%',
    maxWidth: moderateScale(400),
  },
  feedbackTitle: { 
    fontSize: moderateScale(20), 
    fontWeight: 'bold', 
    marginBottom: verticalScale(20), 
    textAlign: 'center',
  },
  ratingContainer: { 
    alignItems: 'center', 
    marginBottom: verticalScale(20), 
    width: '100%',
  },
  ratingText: { 
    fontSize: moderateScale(14), 
    marginTop: moderateScale(8),
  },
  feedbackLabel: { 
    fontSize: moderateScale(16), 
    fontWeight: 'bold', 
    marginBottom: moderateScale(8),
  },
  feedbackInput: { 
    height: verticalScale(120), 
    borderWidth: 1, 
    borderRadius: moderateScale(8), 
    padding: moderateScale(12), 
    textAlignVertical: 'top', 
    width: '100%',
    fontSize: moderateScale(16),
  },
  settingsContainer: { 
    padding: moderateScale(16), 
    width: '100%',
    alignItems: 'center',
    paddingBottom: verticalScale(30),
  },
  settingsCard: { 
    marginBottom: moderateScale(16), 
    width: '100%',
    maxWidth: moderateScale(400),
  },
  settingsSectionTitle: { 
    fontSize: moderateScale(16), 
    fontWeight: 'bold', 
    marginBottom: moderateScale(16),
  },
  settingItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: verticalScale(12), 
    borderBottomWidth: 1, 
    width: '100%',
    minHeight: verticalScale(50),
  },
  settingText: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: { 
    fontSize: moderateScale(16), 
    marginLeft: moderateScale(12),
    flex: 1,
  },
  settingValue: { 
    fontSize: moderateScale(14),
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
    width: '100%',
  },
  uploadButton: {
    marginTop: verticalScale(10),
    padding: moderateScale(10),
    borderRadius: moderateScale(5),
    alignItems: 'center',
    width: moderateScale(150),
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
  recommendationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
    width: '100%',
    flexWrap: 'wrap',
  },
  recommendationBarTitle: {
    fontWeight: 'bold',
    fontSize: moderateScale(13),
    marginRight: moderateScale(5),
    marginBottom: moderateScale(5),
  },
  recommendationScroll: {
    flex: 1,
  },
  recommendationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recommendationBtn: {
    borderWidth: 1,
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    marginRight: moderateScale(6),
    marginBottom: moderateScale(6),
  },
  recommendationBtnText: {
    fontWeight: 'bold',
    fontSize: moderateScale(12),
  },
  recommendationSection: {
    marginBottom: verticalScale(10),
    width: '100%',
  },
  recommendationSectionTitle: {
    fontWeight: 'bold',
    fontSize: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  recommendationScrollView: {
    marginBottom: moderateScale(8),
  },
  recommendationCardContainer: {
    marginRight: moderateScale(12),
  },
  recommendationCard: {
    width: moderateScale(170),
    padding: 0,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    minHeight: moderateScale(150),
  },
  recommendationImage: {
    width: '100%',
    height: moderateScale(90),
  },
  recommendationCardContent: {
    padding: moderateScale(10),
  },
  recommendationCardTitle: {
    fontWeight: 'bold',
    fontSize: moderateScale(14),
    marginBottom: moderateScale(2),
  },
  recommendationCardVenue: {
    fontSize: moderateScale(12),
    marginBottom: moderateScale(2),
  },
  recommendationCardDate: {
    fontSize: moderateScale(12),
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
  },
  detailsScrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingBottom: verticalScale(30),
  },
  editProfileContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
  },
  profileEditContainer: {
    width: '100%',
    padding: moderateScale(16),
    alignItems: 'center',
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