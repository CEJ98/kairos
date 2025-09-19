import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import useTheme from '../hooks/useTheme';
import Button from '../components/Button';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Bienvenido a Kairos Fitness',
    description: 'Tu compañero de entrenamiento personal para alcanzar tus objetivos fitness.',
    image: require('../assets/onboarding-1.png'),
  },
  {
    id: '2',
    title: 'Rutinas Personalizadas',
    description: 'Crea y personaliza rutinas de ejercicio adaptadas a tus necesidades y objetivos.',
    image: require('../assets/onboarding-1.png'),
  },
  {
    id: '3',
    title: 'Seguimiento de Progreso',
    description: 'Visualiza tu progreso con estadísticas detalladas y gráficos intuitivos.',
    image: require('../assets/onboarding-1.png'),
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });
  
  React.useEffect(() => {
    const index = Math.round(scrollX.value / width);
    setCurrentIndex(index);
  }, [scrollX.value]);
  
  const handleSkip = () => {
    // Simular la finalización del onboarding
    // En una implementación real, esto actualizaría el estado en un store
    navigation.navigate('Auth' as never);
  };
  
  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      // Scroll to the next slide
    } else {
      handleSkip();
    }
  };
  
  const renderSlide = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
        
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {item.title}
        </Text>
        
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {item.description}
        </Text>
      </View>
    );
  };
  
  const renderDots = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const dotStyle = useAnimatedStyle(() => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];
            
            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.3, 1, 0.3],
              'clamp'
            );
            
            const dotWidth = interpolate(
              scrollX.value,
              inputRange,
              [8, 16, 8],
              'clamp'
            );
            
            return {
              opacity,
              width: dotWidth,
              backgroundColor: colors.primary,
            };
          });
          
          return (
            <Animated.View
              key={index}
              style={[styles.dot, dotStyle]}
            />
          );
        })}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={[styles.skipText, { color: colors.text.secondary }]}>
          Saltar
        </Text>
      </TouchableOpacity>
      
      <Animated.FlatList
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      />
      
      {renderDots()}
      
      <View style={styles.footer}>
        <Button
          title={currentIndex === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
          onPress={handleNext}
          variant="primary"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});