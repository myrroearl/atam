"""
Flask API for Learning Outcomes Analysis
========================================

RESTful API endpoints for the PLP Academic Management System
Integrates with the LOAnalyzer for ML-powered student performance analysis

Author: PLP Academic Management System
Version: 1.0
Purpose: Capstone Project - Smart Academic Management System
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import pandas as pd
from datetime import datetime
import os
import sys

# Import our custom LOAnalyzer
from lo_analyzer import LOAnalyzer

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Global analyzer instance
analyzer = None

def initialize_analyzer():
    """Initialize the LOAnalyzer instance"""
    global analyzer
    try:
        analyzer = LOAnalyzer(csv_path='python/student_scores.csv')
        analyzer.preprocess_data()
        analyzer.train_models()
        print("✅ LOAnalyzer initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize LOAnalyzer: {str(e)}")
        return False

@app.route('/')
def home():
    """API health check endpoint"""
    return jsonify({
        'message': 'PLP Academic Management System - LO Analysis API',
        'version': '1.0',
        'status': 'running',
        'endpoints': [
            'GET /api/health',
            'POST /api/predict/student',
            'GET /api/analyze/class',
            'GET /api/groups/students',
            'GET /api/report/student/<student_id>',
            'POST /api/predict/topic-to-lo',
            'GET /api/recommendations/<student_id>',
            'POST /api/upload/scores'
        ]
    })

@app.route('/api/health')
def health_check():
    """Detailed health check with system status"""
    global analyzer
    
    status = {
        'api_status': 'healthy',
        'analyzer_initialized': analyzer is not None,
        'timestamp': datetime.now().isoformat(),
        'system_info': {
            'python_version': sys.version,
            'data_file_exists': os.path.exists('python/student_scores.csv')
        }
    }
    
    if analyzer:
        status['data_info'] = {
            'total_records': len(analyzer.data) if analyzer.data is not None else 0,
            'unique_students': analyzer.data['student_id'].nunique() if analyzer.data is not None else 0,
            'models_trained': len(analyzer.models) > 0
        }
    
    return jsonify(status)

@app.route('/api/predict/student', methods=['POST'])
def predict_student_achievement():
    """
    Predict LO achievement for a specific student
    
    Expected JSON body:
    {
        "student_id": 2,
        "learning_outcome": "LO1" (optional)
    }
    """
    global analyzer
    
    if not analyzer:
        return jsonify({'error': 'Analyzer not initialized'}), 500
    
    try:
        data = request.get_json()
        
        if not data or 'student_id' not in data:
            return jsonify({'error': 'student_id is required'}), 400
        
        student_id = data['student_id']
        learning_outcome = data.get('learning_outcome')
        
        predictions = analyzer.predict_student_lo_achievement(student_id, learning_outcome)
        
        if 'error' in predictions:
            return jsonify(predictions), 404
        
        return jsonify({
            'success': True,
            'student_id': student_id,
            'predictions': predictions,
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/api/analyze/class')
def analyze_class():
    """Get comprehensive class performance analysis"""
    global analyzer
    
    if not analyzer:
        return jsonify({'error': 'Analyzer not initialized'}), 500
    
    try:
        analysis = analyzer.analyze_class_performance()
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/api/groups/students')
def group_students():
    """Group students by performance patterns"""
    global analyzer
    
    if not analyzer:
        return jsonify({'error': 'Analyzer not initialized'}), 500
    
    try:
        # Get number of clusters from query parameter (default: 3)
        n_clusters = request.args.get('clusters', 3, type=int)
        
        if n_clusters < 2 or n_clusters > 10:
            return jsonify({'error': 'Number of clusters must be between 2 and 10'}), 400
        
        groups = analyzer.group_students_by_performance(n_clusters)
        
        return jsonify({
            'success': True,
            'groups': groups,
            'cluster_count': n_clusters,
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Grouping failed: {str(e)}'}), 500

@app.route('/api/report/student/<int:student_id>')
def get_student_report(student_id):
    """Get comprehensive report for a specific student"""
    global analyzer
    
    if not analyzer:
        return jsonify({'error': 'Analyzer not initialized'}), 500
    
    try:
        report = analyzer.generate_student_report(student_id)
        
        return jsonify({
            'success': True,
            'report': report
        })
        
    except Exception as e:
        return jsonify({'error': f'Report generation failed: {str(e)}'}), 500

@app.route('/api/predict/topic-to-lo', methods=['POST'])
def predict_topic_to_lo():
    """
    Predict Learning Outcomes for a given task title or topic
    Useful for handling late submissions or new tasks
    
    Expected JSON body:
    {
        "task_title": "Research Methodology Assignment",
        "topic": "Literature Review" (optional)
    }
    """
    global analyzer
    
    if not analyzer:
        return jsonify({'error': 'Analyzer not initialized'}), 500
    
    try:
        data = request.get_json()
        
        if not data or 'task_title' not in data:
            return jsonify({'error': 'task_title is required'}), 400
        
        task_title = data['task_title']
        topic = data.get('topic')
        
        predicted_los = analyzer.predict_lo_from_topic(task_title, topic)
        
        # Get detailed information about predicted LOs
        lo_details = {}
        for lo in predicted_los:
            if lo in analyzer.curriculum_mapping:
                lo_details[lo] = {
                    'description': analyzer.curriculum_mapping[lo]['description'],
                    'related_topics': analyzer.curriculum_mapping[lo]['topics']
                }
        
        return jsonify({
            'success': True,
            'input': {
                'task_title': task_title,
                'topic': topic
            },
            'predicted_los': predicted_los,
            'lo_details': lo_details,
            'confidence': 'high' if len(predicted_los) == 1 else 'medium',
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'LO prediction failed: {str(e)}'}), 500

@app.route('/api/recommendations/<int:student_id>')
def get_student_recommendations(student_id):
    """Get personalized recommendations for a student"""
    global analyzer
    
    if not analyzer:
        return jsonify({'error': 'Analyzer not initialized'}), 500
    
    try:
        # Get predictions first
        predictions = analyzer.predict_student_lo_achievement(student_id)
        
        if 'error' in predictions:
            return jsonify(predictions), 404
        
        # Extract recommendations and priority areas
        recommendations = []
        priority_areas = []
        
        for lo, data in predictions.items():
            recommendations.append({
                'learning_outcome': lo,
                'recommendation': data['recommendation'],
                'current_status': data['current_status'],
                'probability': data['ensemble_probability']
            })
            
            # Identify priority areas (< 60% probability of achievement)
            if data['ensemble_probability'] < 0.6:
                priority_areas.append({
                    'learning_outcome': lo,
                    'description': analyzer.curriculum_mapping[lo]['description'],
                    'probability': data['ensemble_probability'],
                    'urgency': 'high' if data['ensemble_probability'] < 0.4 else 'medium'
                })
        
        return jsonify({
            'success': True,
            'student_id': student_id,
            'recommendations': recommendations,
            'priority_areas': priority_areas,
            'overall_status': 'needs_attention' if priority_areas else 'on_track',
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Recommendations failed: {str(e)}'}), 500

@app.route('/api/upload/scores', methods=['POST'])
def upload_scores():
    """
    Upload new student scores and retrain models
    
    Expected JSON body:
    {
        "scores": [
            {
                "student_id": 11,
                "student_name": "New Student",
                "course": "Capstone 1",
                "subject": "BSIT3B",
                "task_id": 1,
                "task_title": "New Assignment",
                "score": 85,
                "total_score": 100,
                "date_submitted": "2025-01-20",
                "learning_outcomes": "LO1;LO2",
                "topic": "New Topic"
            }
        ]
    }
    """
    global analyzer
    
    if not analyzer:
        return jsonify({'error': 'Analyzer not initialized'}), 500
    
    try:
        data = request.get_json()
        
        if not data or 'scores' not in data:
            return jsonify({'error': 'scores array is required'}), 400
        
        new_scores = data['scores']
        
        # Validate required fields
        required_fields = ['student_id', 'student_name', 'task_title', 'score', 
                          'total_score', 'learning_outcomes']
        
        for score in new_scores:
            missing_fields = [field for field in required_fields if field not in score]
            if missing_fields:
                return jsonify({
                    'error': f'Missing required fields: {missing_fields}'
                }), 400
        
        # Create new DataFrame and append to existing data
        new_df = pd.DataFrame(new_scores)
        
        # Fill missing optional fields
        new_df['course'] = new_df.get('course', 'Unknown Course')
        new_df['subject'] = new_df.get('subject', 'Unknown Subject')
        new_df['task_id'] = new_df.get('task_id', range(1000, 1000 + len(new_df)))
        new_df['date_submitted'] = new_df.get('date_submitted', datetime.now().strftime('%Y-%m-%d'))
        new_df['topic'] = new_df.get('topic', 'Unknown Topic')
        
        # Append to existing data
        analyzer.data = pd.concat([analyzer.data, new_df], ignore_index=True)
        
        # Reprocess and retrain
        analyzer.preprocess_data()
        analyzer.train_models()
        
        # Save updated data
        analyzer.data.to_csv('python/student_scores.csv', index=False)
        
        return jsonify({
            'success': True,
            'message': f'Successfully uploaded {len(new_scores)} new score records',
            'total_records': len(analyzer.data),
            'unique_students': analyzer.data['student_id'].nunique(),
            'models_retrained': True,
            'updated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/curriculum/mapping')
def get_curriculum_mapping():
    """Get the current curriculum-to-LO mapping"""
    global analyzer
    
    if not analyzer:
        return jsonify({'error': 'Analyzer not initialized'}), 500
    
    return jsonify({
        'success': True,
        'curriculum_mapping': analyzer.curriculum_mapping,
        'generated_at': datetime.now().isoformat()
    })

@app.route('/api/students/list')
def list_students():
    """Get list of all students in the system"""
    global analyzer
    
    if not analyzer:
        return jsonify({'error': 'Analyzer not initialized'}), 500
    
    try:
        students = analyzer.data.groupby('student_id').agg({
            'student_name': 'first',
            'course': 'first',
            'subject': 'first',
            'score': 'count',  # Total number of tasks
            'percentage_score': 'mean'  # Average percentage
        }).reset_index()
        
        students.columns = ['student_id', 'student_name', 'course', 'subject', 'total_tasks', 'avg_percentage']
        students['avg_percentage'] = students['avg_percentage'].round(2)
        
        return jsonify({
            'success': True,
            'students': students.to_dict('records'),
            'total_count': len(students),
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to list students: {str(e)}'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

# Initialize analyzer on startup (Flask 2.3+ compatible)
def startup():
    """Initialize the analyzer when the app starts"""
    print("🚀 Starting PLP Academic Management API...")
    if not initialize_analyzer():
        print("⚠️ API started but analyzer initialization failed")
    else:
        print("✅ API fully initialized and ready!")

# Register startup function to run with the app context
with app.app_context():
    startup()

if __name__ == '__main__':
    print("🎓 PLP Academic Management System - Flask API")
    print("=" * 50)
    
    # Check if data file exists
    if not os.path.exists('python/student_scores.csv'):
        print("❌ python/student_scores.csv not found!")
        print("   Please ensure the data file is in the same directory as this script.")
        sys.exit(1)
    
    # Initialize analyzer
    if initialize_analyzer():
        print("🌐 Starting Flask server...")
        app.run(
            host='0.0.0.0',  # Allow external connections
            port=5000,
            debug=True
        )
    else:
        print("❌ Failed to start API due to analyzer initialization error")
        sys.exit(1) 