import os
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, jsonify, redirect, url_for
import plotly.express as px
import plotly.graph_objects as go
import plotly.io as pio
from plotly.subplots import make_subplots
import json

app = Flask(__name__)

# Configure Plotly for dark theme
pio.templates.default = "plotly_dark"

# Global variables
data = None
subjects = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    global data, subjects
    if 'file' not in request.files:
        return redirect(request.url)
    
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
    
    if file and (file.filename.endswith('.csv') or file.filename.endswith('.xlsx')):
        try:
            if file.filename.endswith('.csv'):
                data = pd.read_csv(file)
            else:
                data = pd.read_excel(file)
                
            # Clean column names and data
            data.columns = data.columns.str.strip()
            
            # Identify subject columns (assuming they are between 'Seat Number' and 'SUPW')
            all_columns = list(data.columns)
            try:
                start_idx = all_columns.index('Seat Number') + 1
                end_idx = all_columns.index('SUPW')
                subjects = all_columns[start_idx:end_idx]
            except ValueError:
                # If exact columns not found, make an educated guess based on the sample data
                numeric_cols = data.select_dtypes(include=['number']).columns.tolist()
                subjects = numeric_cols
            
            # Convert subject columns to numeric
            for subject in subjects:
                data[subject] = pd.to_numeric(data[subject], errors='coerce')
                
            return redirect(url_for('dashboard'))
        except Exception as e:
            return render_template('index.html', error=str(e))
    
    return redirect(request.url)

@app.route('/dashboard')
def dashboard():
    if data is None:
        return redirect(url_for('index'))
    
    # Get basic stats
    total_students = len(data)
    avg_scores = {subject: data[subject].mean() for subject in subjects}
    top_performers = data.nlargest(5, subjects).to_dict('records')
    
    return render_template('dashboard.html', 
                           total_students=total_students,
                           subjects=subjects,
                           avg_scores=avg_scores,
                           top_performers=top_performers)

@app.route('/api/subject_performance')
def subject_performance():
    if data is None:
        return jsonify({'error': 'No data available'})
    
    # Calculate average, min, max for each subject
    performance = []
    for subject in subjects:
        performance.append({
            'subject': subject,
            'average': data[subject].mean(),
            'min': data[subject].min(),
            'max': data[subject].max(),
            'median': data[subject].median(),
            'below_60': (data[subject] < 60).sum(),
            'above_90': (data[subject] >= 90).sum()
        })
    
    return jsonify(performance)

@app.route('/api/student_performance/<student_id>')
def student_performance(student_id):
    if data is None:
        return jsonify({'error': 'No data available'})
    
    # Find student by ID
    student = data[data['Unique ID'] == int(student_id)]
    if student.empty:
        return jsonify({'error': 'Student not found'})
    
    # Get student's performance
    student_data = student.iloc[0].to_dict()
    performance = {subject: student_data[subject] for subject in subjects}
    
    return jsonify({
        'name': student_data['Name'],
        'id': student_data['Unique ID'],
        'performance': performance
    })

@app.route('/api/top_students')
def top_students():
    if data is None:
        return jsonify({'error': 'No data available'})
    
    # Calculate total score for each student
    data['total_score'] = data[subjects].sum(axis=1)
    top_10 = data.nlargest(10, 'total_score')
    
    result = []
    for _, student in top_10.iterrows():
        result.append({
            'name': student['Name'],
            'id': student['Unique ID'],
            'total_score': student['total_score'],
            'average': student[subjects].mean()
        })
    
    return jsonify(result)

@app.route('/api/subject_distribution')
def subject_distribution():
    if data is None:
        return jsonify({'error': 'No data available'})
    
    distributions = {}
    for subject in subjects:
        # Create bins for score ranges
        bins = [0, 35, 50, 60, 70, 80, 90, 100]
        labels = ['0-35', '36-50', '51-60', '61-70', '71-80', '81-90', '91-100']
        
        # Count students in each bin
        distribution = pd.cut(data[subject], bins=bins, labels=labels).value_counts().sort_index()
        
        distributions[subject] = {
            'ranges': labels,
            'counts': distribution.tolist()
        }
    
    return jsonify(distributions)

@app.route('/api/correlation_matrix')
def correlation_matrix():
    if data is None:
        return jsonify({'error': 'No data available'})
    
    # Calculate correlation matrix between subjects
    corr_matrix = data[subjects].corr().round(2)
    
    # Convert to format suitable for heatmap
    result = {
        'subjects': subjects,
        'matrix': corr_matrix.values.tolist()
    }
    
    return jsonify(result)

@app.route('/api/performance_by_grade')
def performance_by_grade():
    if data is None or 'SUPW' not in data.columns:
        return jsonify({'error': 'No grade data available'})
    
    # Group by SUPW grade and calculate average for each subject
    grade_performance = data.groupby('SUPW')[subjects].mean().reset_index()
    
    result = []
    for _, row in grade_performance.iterrows():
        grade_data = {
            'grade': row['SUPW'],
            'performance': {}
        }
        
        for subject in subjects:
            grade_data['performance'][subject] = row[subject]
        
        result.append(grade_data)
    
    return jsonify(result)

@app.route('/get_data')
def get_data():
    if data is None:
        return jsonify({'error': 'No data available'}), 404
    
    # Convert DataFrame to list of dictionaries for JSON serialization
    students_data = data.fillna('').to_dict('records')
    
    # Return both student data and subject list
    return jsonify({
        'students': students_data,
        'subjects': subjects
    })

if __name__ == '__main__':
    app.run(debug=True)