"""
Learning Outcomes (LO) Analyzer
===============================

A comprehensive machine learning system for analyzing student performance 
and predicting Learning Outcome achievement in academic settings.

Author: PLP Academic Management System
Version: 1.0
Purpose: Capstone Project - Smart Academic Management System
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.cluster import KMeans
import json
import re
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class LOAnalyzer:
    """
    Main class for Learning Outcomes Analysis and Prediction
    
    Features:
    - Load and preprocess student score data
    - Calculate LO achievement based on configurable thresholds
    - Train ML models for LO achievement prediction
    - Handle late submissions and topic-to-LO mapping
    - Generate student performance insights and recommendations
    - Group students based on performance patterns
    """
    
    def __init__(self, csv_path='python/student_scores.csv', achievement_threshold=70):
        """
        Initialize the LOAnalyzer
        
        Args:
            csv_path (str): Path to the student scores CSV file
            achievement_threshold (float): Minimum percentage for LO achievement (default: 70%)
        """
        self.csv_path = csv_path
        self.achievement_threshold = achievement_threshold
        self.data = None
        self.processed_data = None
        self.models = {}
        self.scalers = {}
        self.label_encoders = {}
        
        # Predefined curriculum mapping for late submissions
        self.curriculum_mapping = {
            'LO1': {
                'description': 'Problem Identification and Project Conceptualization',
                'topics': [
                    'Course Orientation and Capstone Overview',
                    'Identifying Real-World Problems',
                    'Project Title and Objectives',
                    'Consultation and Proposal Refinement'
                ],
                'keywords': ['orientation', 'problem', 'identification', 'title', 'objective', 'consultation']
            },
            'LO2': {
                'description': 'Literature Review and Research Skills',
                'topics': [
                    'Review of Related Literature and Studies',
                    'Consultation and Proposal Refinement'
                ],
                'keywords': ['literature', 'review', 'research', 'related', 'studies', 'references']
            },
            'LO3': {
                'description': 'Project Scope and Significance Definition',
                'topics': [
                    'Project Title and Objectives',
                    'Defining Scope Delimitation and Significance',
                    'Consultation and Proposal Refinement'
                ],
                'keywords': ['scope', 'delimitation', 'significance', 'objectives', 'limitations']
            },
            'LO4': {
                'description': 'Methodology and System Implementation',
                'topics': [
                    'Methodology and System Design Overview',
                    'Final Proposal Submission and Presentation',
                    'System Development Phase',
                    'Consultation and Proposal Refinement'
                ],
                'keywords': ['methodology', 'system', 'design', 'implementation', 'development', 'proposal']
            }
        }
        
        # Initialize the analyzer
        self.load_data()
        
    def load_data(self):
        """Load and perform initial data validation"""
        try:
            self.data = pd.read_csv(self.csv_path)
            print(f"✅ Successfully loaded {len(self.data)} records from {self.csv_path}")
            
            # Validate required columns
            required_columns = ['student_id', 'student_name', 'task_title', 'score', 
                              'total_score', 'learning_outcomes', 'topic']
            missing_columns = [col for col in required_columns if col not in self.data.columns]
            
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
                
            print(f"📊 Data shape: {self.data.shape}")
            print(f"👥 Unique students: {self.data['student_id'].nunique()}")
            print(f"📝 Unique tasks: {self.data['task_title'].nunique()}")
            
        except Exception as e:
            print(f"❌ Error loading data: {str(e)}")
            raise
    
    def preprocess_data(self):
        """
        Preprocess the data for ML analysis
        - Calculate percentage scores
        - Extract and expand learning outcomes
        - Handle multiple LOs per task
        - Create feature engineering
        """
        print("🔄 Preprocessing data...")
        
        # Calculate percentage scores
        self.data['percentage_score'] = (self.data['score'] / self.data['total_score']) * 100
        
        # Convert date strings to datetime
        self.data['date_submitted'] = pd.to_datetime(self.data['date_submitted'])
        
        # Expand learning outcomes (handle multiple LOs per task)
        expanded_rows = []
        
        for _, row in self.data.iterrows():
            los = str(row['learning_outcomes']).split(';')
            for lo in los:
                lo = lo.strip()
                if lo and lo != 'nan':
                    new_row = row.copy()
                    new_row['learning_outcome'] = lo
                    new_row['achieved'] = 1 if row['percentage_score'] >= self.achievement_threshold else 0
                    expanded_rows.append(new_row)
        
        self.processed_data = pd.DataFrame(expanded_rows)
        
        # Feature engineering
        self.processed_data['score_category'] = pd.cut(
            self.processed_data['percentage_score'], 
            bins=[0, 60, 70, 80, 90, 100], 
            labels=['Failing', 'Below Average', 'Average', 'Good', 'Excellent']
        )
        
        # Calculate student-level aggregations
        student_stats = self.processed_data.groupby(['student_id', 'learning_outcome']).agg({
            'percentage_score': ['mean', 'std', 'count'],
            'achieved': 'mean'
        }).reset_index()
        
        student_stats.columns = ['student_id', 'learning_outcome', 'avg_score', 'score_std', 'task_count', 'achievement_rate']
        student_stats['score_std'] = student_stats['score_std'].fillna(0)
        
        self.student_lo_summary = student_stats
        
        print(f"✅ Preprocessing complete. Expanded to {len(self.processed_data)} LO-specific records")
        print(f"📈 Achievement rate: {self.processed_data['achieved'].mean():.2%}")
        
    def predict_lo_from_topic(self, task_title, topic=None):
        """
        Predict the most likely Learning Outcome(s) for a given task or topic
        Useful for handling late submissions or tasks without explicit LO mapping
        
        Args:
            task_title (str): Title of the task/assignment
            topic (str, optional): Topic or lesson name
            
        Returns:
            list: Most likely LO(s) based on keyword matching and similarity
        """
        text_to_analyze = f"{task_title} {topic or ''}".lower()
        
        lo_scores = {}
        
        for lo, info in self.curriculum_mapping.items():
            score = 0
            
            # Keyword matching
            keyword_matches = sum(1 for keyword in info['keywords'] if keyword in text_to_analyze)
            score += keyword_matches * 2
            
            # Topic similarity
            for curriculum_topic in info['topics']:
                topic_words = set(curriculum_topic.lower().split())
                text_words = set(text_to_analyze.split())
                common_words = topic_words.intersection(text_words)
                score += len(common_words)
            
            lo_scores[lo] = score
        
        # Return LOs with highest scores (minimum score of 1 to be considered)
        sorted_los = sorted(lo_scores.items(), key=lambda x: x[1], reverse=True)
        predicted_los = [lo for lo, score in sorted_los if score > 0]
        
        if not predicted_los:
            # Fallback: return LO1 for unknown tasks
            predicted_los = ['LO1']
        
        return predicted_los[:2]  # Return top 2 most likely LOs
    
    def train_models(self):
        """
        Train multiple ML models for LO achievement prediction
        - Random Forest Classifier
        - Logistic Regression
        """
        if self.processed_data is None:
            self.preprocess_data()
        
        print("🤖 Training ML models...")
        
        # Prepare features for student-level prediction
        features_df = self.student_lo_summary.copy()
        
        # Encode categorical variables
        le_lo = LabelEncoder()
        features_df['lo_encoded'] = le_lo.fit_transform(features_df['learning_outcome'])
        self.label_encoders['learning_outcome'] = le_lo
        
        # Features for training
        feature_columns = ['avg_score', 'score_std', 'task_count', 'lo_encoded']
        X = features_df[feature_columns]
        y = (features_df['achievement_rate'] >= 0.7).astype(int)  # Binary achievement
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        self.scalers['main'] = scaler
        
        # Train Random Forest
        rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        rf_model.fit(X_train_scaled, y_train)
        rf_pred = rf_model.predict(X_test_scaled)
        rf_accuracy = accuracy_score(y_test, rf_pred)
        
        self.models['random_forest'] = rf_model
        
        # Train Logistic Regression
        lr_model = LogisticRegression(random_state=42)
        lr_model.fit(X_train_scaled, y_train)
        lr_pred = lr_model.predict(X_test_scaled)
        lr_accuracy = accuracy_score(y_test, lr_pred)
        
        self.models['logistic_regression'] = lr_model
        
        print(f"🎯 Random Forest Accuracy: {rf_accuracy:.3f}")
        print(f"🎯 Logistic Regression Accuracy: {lr_accuracy:.3f}")
        
        # Feature importance (Random Forest)
        feature_importance = pd.DataFrame({
            'feature': feature_columns,
            'importance': rf_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\n📈 Feature Importance (Random Forest):")
        for _, row in feature_importance.iterrows():
            print(f"  {row['feature']}: {row['importance']:.3f}")
    
    def predict_student_lo_achievement(self, student_id, learning_outcome=None):
        """
        Predict LO achievement for a specific student
        
        Args:
            student_id (int): Student ID
            learning_outcome (str, optional): Specific LO to predict
            
        Returns:
            dict: Prediction results with probabilities and recommendations
        """
        if not self.models:
            self.train_models()
        
        student_data = self.student_lo_summary[
            self.student_lo_summary['student_id'] == student_id
        ].copy()
        
        if student_data.empty:
            return {"error": f"No data found for student {student_id}"}
        
        if learning_outcome:
            student_data = student_data[student_data['learning_outcome'] == learning_outcome]
            if student_data.empty:
                return {"error": f"No data found for student {student_id} and LO {learning_outcome}"}
        
        predictions = {}
        
        for _, row in student_data.iterrows():
            lo = row['learning_outcome']
            
            # Prepare features
            lo_encoded = self.label_encoders['learning_outcome'].transform([lo])[0]
            features = np.array([[row['avg_score'], row['score_std'], row['task_count'], lo_encoded]])
            features_scaled = self.scalers['main'].transform(features)
            
            # Get predictions from both models
            rf_pred = self.models['random_forest'].predict(features_scaled)[0]
            rf_prob = self.models['random_forest'].predict_proba(features_scaled)[0]
            
            lr_pred = self.models['logistic_regression'].predict(features_scaled)[0]
            lr_prob = self.models['logistic_regression'].predict_proba(features_scaled)[0]
            
            # Current achievement status
            current_achievement = row['achievement_rate'] >= 0.7
            
            predictions[lo] = {
                'current_achievement_rate': row['achievement_rate'],
                'current_status': 'Achieved' if current_achievement else 'Not Achieved',
                'current_avg_score': row['avg_score'],
                'task_count': int(row['task_count']),
                'predictions': {
                    'random_forest': {
                        'prediction': 'Will Achieve' if rf_pred == 1 else 'May Not Achieve',
                        'probability': float(rf_prob[1])
                    },
                    'logistic_regression': {
                        'prediction': 'Will Achieve' if lr_pred == 1 else 'May Not Achieve',
                        'probability': float(lr_prob[1])
                    }
                },
                'ensemble_probability': float((rf_prob[1] + lr_prob[1]) / 2),
                'recommendation': self._generate_recommendation(row, rf_prob[1], lr_prob[1])
            }
        
        return predictions
    
    def _generate_recommendation(self, student_row, rf_prob, lr_prob):
        """Generate personalized recommendations based on student performance"""
        avg_prob = (rf_prob + lr_prob) / 2
        avg_score = student_row['avg_score']
        achievement_rate = student_row['achievement_rate']
        lo = student_row['learning_outcome']
        
        if avg_prob >= 0.8 and achievement_rate >= 0.7:
            return f"🎉 Excellent progress in {lo}! Continue current study approach."
        elif avg_prob >= 0.6 and achievement_rate >= 0.5:
            return f"👍 Good progress in {lo}. Focus on consistency to maintain achievement."
        elif avg_prob >= 0.4:
            return f"⚠️ {lo} needs attention. Current average: {avg_score:.1f}%. Recommend additional practice and review of {self.curriculum_mapping[lo]['description'].lower()}."
        else:
            return f"🚨 {lo} requires immediate intervention. Consider one-on-one tutoring, review of fundamental concepts, and additional assignments."
    
    def analyze_class_performance(self):
        """
        Analyze overall class performance and generate insights
        
        Returns:
            dict: Comprehensive class analysis
        """
        if self.processed_data is None:
            self.preprocess_data()
        
        analysis = {}
        
        # Overall class statistics
        analysis['overall_stats'] = {
            'total_students': int(self.processed_data['student_id'].nunique()),
            'total_tasks': int(self.processed_data['task_title'].nunique()),
            'overall_achievement_rate': float(self.processed_data['achieved'].mean()),
            'average_score': float(self.processed_data['percentage_score'].mean())
        }
        
        # LO-specific analysis
        lo_analysis = self.processed_data.groupby('learning_outcome').agg({
            'achieved': ['mean', 'count'],
            'percentage_score': ['mean', 'std']
        }).round(3)
        
        lo_analysis.columns = ['achievement_rate', 'total_attempts', 'avg_score', 'score_std']
        analysis['lo_performance'] = lo_analysis.to_dict('index')
        
        # Student performance distribution
        student_performance = self.student_lo_summary.groupby('student_id').agg({
            'achievement_rate': 'mean',
            'avg_score': 'mean'
        }).reset_index()
        
        analysis['performance_distribution'] = {
            'high_achievers': int((student_performance['achievement_rate'] >= 0.8).sum()),
            'average_performers': int(((student_performance['achievement_rate'] >= 0.6) & 
                                     (student_performance['achievement_rate'] < 0.8)).sum()),
            'needs_support': int((student_performance['achievement_rate'] < 0.6).sum())
        }
        
        return analysis
    
    def group_students_by_performance(self, n_clusters=3):
        """
        Group students based on their performance patterns using K-Means clustering
        
        Args:
            n_clusters (int): Number of clusters/groups to create
            
        Returns:
            dict: Student groupings with characteristics
        """
        if self.student_lo_summary is None:
            self.preprocess_data()
        
        # Prepare data for clustering
        student_features = self.student_lo_summary.groupby('student_id').agg({
            'avg_score': 'mean',
            'achievement_rate': 'mean',
            'task_count': 'sum'
        }).reset_index()
        
        # Features for clustering
        features = student_features[['avg_score', 'achievement_rate', 'task_count']]
        features_scaled = StandardScaler().fit_transform(features)
        
        # Perform clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        student_features['cluster'] = kmeans.fit_predict(features_scaled)
        
        # Analyze clusters
        cluster_analysis = {}
        
        for cluster_id in range(n_clusters):
            cluster_students = student_features[student_features['cluster'] == cluster_id]
            
            cluster_analysis[f'Group_{cluster_id + 1}'] = {
                'student_count': len(cluster_students),
                'avg_score_range': f"{cluster_students['avg_score'].min():.1f}-{cluster_students['avg_score'].max():.1f}%",
                'avg_achievement_rate': float(cluster_students['achievement_rate'].mean()),
                'characteristics': self._describe_cluster(cluster_students),
                'student_ids': cluster_students['student_id'].tolist(),
                'recommendations': self._cluster_recommendations(cluster_students)
            }
        
        return cluster_analysis
    
    def _describe_cluster(self, cluster_data):
        """Describe characteristics of a student cluster"""
        avg_score = cluster_data['avg_score'].mean()
        avg_achievement = cluster_data['achievement_rate'].mean()
        
        if avg_achievement >= 0.8:
            return "High Achievers - Consistently meeting learning outcomes"
        elif avg_achievement >= 0.6:
            return "Average Performers - Meeting most learning outcomes with room for improvement"
        else:
            return "Needs Support - Struggling to meet learning outcomes, requires intervention"
    
    def _cluster_recommendations(self, cluster_data):
        """Generate recommendations for student clusters"""
        avg_achievement = cluster_data['achievement_rate'].mean()
        
        if avg_achievement >= 0.8:
            return "Provide advanced challenges and leadership opportunities"
        elif avg_achievement >= 0.6:
            return "Focus on consistency and targeted skill development"
        else:
            return "Implement intensive support program with regular monitoring"
    
    def generate_student_report(self, student_id):
        """
        Generate a comprehensive report for a specific student
        
        Args:
            student_id (int): Student ID
            
        Returns:
            dict: Complete student performance report
        """
        # Get student name
        student_name = self.data[self.data['student_id'] == student_id]['student_name'].iloc[0]
        
        # Get predictions
        predictions = self.predict_student_lo_achievement(student_id)
        
        # Get student's raw data
        student_tasks = self.data[self.data['student_id'] == student_id].copy()
        student_tasks['percentage_score'] = (student_tasks['score'] / student_tasks['total_score']) * 100
        
        report = {
            'student_info': {
                'student_id': student_id,
                'student_name': student_name,
                'total_tasks_completed': len(student_tasks)
            },
            'overall_performance': {
                'average_score': float(student_tasks['percentage_score'].mean()),
                'highest_score': float(student_tasks['percentage_score'].max()),
                'lowest_score': float(student_tasks['percentage_score'].min()),
                'tasks_above_threshold': int((student_tasks['percentage_score'] >= self.achievement_threshold).sum())
            },
            'lo_predictions': predictions,
            'recent_performance': student_tasks.nlargest(5, 'date_submitted')[
                ['task_title', 'percentage_score', 'date_submitted', 'learning_outcomes']
            ].to_dict('records'),
            'improvement_areas': self._identify_improvement_areas(predictions),
            'generated_at': datetime.now().isoformat()
        }
        
        return report
    
    def _identify_improvement_areas(self, predictions):
        """Identify areas where student needs improvement"""
        improvement_areas = []
        
        for lo, data in predictions.items():
            if data['current_achievement_rate'] < 0.7 or data['ensemble_probability'] < 0.6:
                improvement_areas.append({
                    'learning_outcome': lo,
                    'description': self.curriculum_mapping[lo]['description'],
                    'current_rate': data['current_achievement_rate'],
                    'predicted_probability': data['ensemble_probability'],
                    'priority': 'High' if data['ensemble_probability'] < 0.4 else 'Medium'
                })
        
        return sorted(improvement_areas, key=lambda x: x['predicted_probability'])

def main():
    """Main function to demonstrate the LOAnalyzer functionality"""
    print("🎓 PLP Academic Management System - Learning Outcomes Analyzer")
    print("=" * 70)
    
    try:
        # Initialize analyzer
        analyzer = LOAnalyzer()
        
        # Preprocess data
        analyzer.preprocess_data()
        
        # Train models
        analyzer.train_models()
        
        # Demonstrate topic-to-LO mapping
        print("\n🔍 Topic-to-LO Mapping Examples:")
        test_topics = [
            "Research Methodology Assignment",
            "System Design Project",
            "Literature Review Task",
            "Problem Analysis Exercise"
        ]
        
        for topic in test_topics:
            predicted_los = analyzer.predict_lo_from_topic(topic)
            print(f"  '{topic}' → {predicted_los}")
        
        # Analyze class performance
        print("\n📊 Class Performance Analysis:")
        class_analysis = analyzer.analyze_class_performance()
        print(f"  Total Students: {class_analysis['overall_stats']['total_students']}")
        print(f"  Overall Achievement Rate: {class_analysis['overall_stats']['overall_achievement_rate']:.2%}")
        print(f"  Average Score: {class_analysis['overall_stats']['average_score']:.1f}%")
        
        # Group students
        print("\n👥 Student Grouping Analysis:")
        groups = analyzer.group_students_by_performance()
        for group_name, group_data in groups.items():
            print(f"  {group_name}: {group_data['student_count']} students - {group_data['characteristics']}")
        
        # Generate sample student report
        sample_student_id = analyzer.data['student_id'].iloc[0]
        print(f"\n📝 Sample Student Report (ID: {sample_student_id}):")
        report = analyzer.generate_student_report(sample_student_id)
        print(f"  Student: {report['student_info']['student_name']}")
        print(f"  Average Score: {report['overall_performance']['average_score']:.1f}%")
        print(f"  Tasks Completed: {report['student_info']['total_tasks_completed']}")
        
        # Save results to JSON for frontend integration
        results = {
            'class_analysis': class_analysis,
            'student_groups': groups,
            'sample_report': report,
            'generated_at': datetime.now().isoformat()
        }
        
        with open('lo_analysis_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print("\n✅ Analysis complete! Results saved to 'lo_analysis_results.json'")
        print("🔗 Ready for Flask API integration")
        
    except Exception as e:
        print(f"❌ Error during analysis: {str(e)}")
        raise

if __name__ == "__main__":
    main() 