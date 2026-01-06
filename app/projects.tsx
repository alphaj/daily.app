import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  ChevronRight,
  Trophy,
  Target,
} from 'lucide-react-native';
import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProjects } from '@/contexts/ProjectContext';
import type { Project } from '@/types/project';

function ProjectCard({ 
  project, 
  progress,
  onPress 
}: { 
  project: Project; 
  progress: number;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const completedTasks = project.tasks.filter(t => t.completed).length;
  const totalTasks = project.tasks.length;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View 
        style={[
          styles.projectCard,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={[styles.cardAccent, { backgroundColor: project.color }]} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${project.color}15` }]}>
              <Text style={styles.projectIcon}>{project.icon}</Text>
            </View>
            <ChevronRight size={20} color="#C7C7CC" />
          </View>

          <Text style={styles.projectName} numberOfLines={2}>{project.name}</Text>
          
          {project.description ? (
            <Text style={styles.projectDescription} numberOfLines={1}>
              {project.description}
            </Text>
          ) : null}

          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${progress}%`,
                    backgroundColor: project.color 
                  }
                ]} 
              />
            </View>
            <View style={styles.progressStats}>
              <Text style={styles.progressText}>
                {completedTasks}/{totalTasks} steps
              </Text>
              <Text style={[styles.progressPercent, { color: project.color }]}>
                {progress}%
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function CompletedProjectCard({ 
  project,
  onPress 
}: { 
  project: Project;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.completedCard} onPress={onPress}>
      <View style={[styles.completedIconBg, { backgroundColor: `${project.color}20` }]}>
        <Text style={styles.completedIcon}>{project.icon}</Text>
      </View>
      <View style={styles.completedInfo}>
        <Text style={styles.completedName} numberOfLines={1}>{project.name}</Text>
        <Text style={styles.completedStats}>{project.tasks.length} steps completed</Text>
      </View>
      <Trophy size={16} color="#FFD60A" fill="#FFD60A" />
    </Pressable>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Target size={48} color="#C7C7CC" strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTitle}>No projects yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first project to start{'\n'}tracking your goals
      </Text>
      <Pressable style={styles.emptyButton} onPress={onAdd}>
        <Plus size={20} color="#fff" strokeWidth={2.5} />
        <Text style={styles.emptyButtonText}>New Project</Text>
      </Pressable>
    </View>
  );
}

export default function ProjectsScreen() {
  const router = useRouter();
  const { activeProjects, completedProjects, getProjectProgress, isLoading } = useProjects();

  const handleAddProject = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/add-project');
  }, [router]);

  const handleProjectPress = useCallback((projectId: string) => {
    router.push(`/project/${projectId}` as const);
  }, [router]);

  const hasProjects = activeProjects.length > 0 || completedProjects.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={10}
        >
          <ArrowLeft size={24} color="#000" strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Projects</Text>
        <Pressable 
          style={styles.addButton}
          onPress={handleAddProject}
          hitSlop={10}
        >
          <Plus size={24} color="#000" strokeWidth={1.5} />
        </Pressable>
      </View>

      {!hasProjects && !isLoading ? (
        <EmptyState onAdd={handleAddProject} />
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeProjects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>In Progress</Text>
              <View style={styles.projectsList}>
                {activeProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    progress={getProjectProgress(project)}
                    onPress={() => handleProjectPress(project.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {completedProjects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Completed</Text>
              <View style={styles.completedList}>
                {completedProjects.map(project => (
                  <CompletedProjectCard
                    key={project.id}
                    project={project}
                    onPress={() => handleProjectPress(project.id)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.3,
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  projectsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardAccent: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectIcon: {
    fontSize: 24,
  },
  projectName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  progressSection: {
    marginTop: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  completedList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  completedIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIcon: {
    fontSize: 20,
  },
  completedInfo: {
    flex: 1,
  },
  completedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  completedStats: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
