document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let studentData = [];
    let subjects = [];
    let currentSubject = '';
    
    // Fetch and parse CSV data
    async function fetchData() {
        try {
            const response = await fetch('/get_data');
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            
            const data = await response.json();
            studentData = data.students;
            subjects = data.subjects;
            
            // Set default subject
            if (subjects.length > 0) {
                currentSubject = subjects[0];
                const subjectSelect = document.getElementById('subject-select');
                if (subjectSelect) {
                    subjectSelect.value = currentSubject;
                }
            }
            
            // Initialize dashboard
            initializeDashboard();
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load data. Please try again.');
        }
    }
    
    // Initialize dashboard with all visualizations
    function initializeDashboard() {
        // Update overview stats
        updateOverviewStats();
        
        // Create overview charts
        createOverviewCharts();
        
        // Initialize subject analysis if subject is selected
        if (currentSubject) {
            updateSubjectAnalysis(currentSubject);
        }
        
        // Initialize event listeners
        initializeEventListeners();
    }
    
    // Update overview statistics
    function updateOverviewStats() {
        if (studentData.length === 0) return;
        
        // Calculate overall average
        let totalSum = 0;
        let totalCount = 0;
        
        // Find top performer
        let topPerformer = null;
        let topScore = -1;
        
        // Find best subject
        const subjectSums = {};
        const subjectCounts = {};
        
        // Calculate statistics
        studentData.forEach(student => {
            let studentSum = 0;
            let studentCount = 0;
            
            subjects.forEach(subject => {
                if (student[subject] !== undefined && !isNaN(student[subject])) {
                    const score = parseFloat(student[subject]);
                    
                    // Add to overall total
                    totalSum += score;
                    totalCount++;
                    
                    // Add to student total
                    studentSum += score;
                    studentCount++;
                    
                    // Add to subject totals
                    if (!subjectSums[subject]) subjectSums[subject] = 0;
                    if (!subjectCounts[subject]) subjectCounts[subject] = 0;
                    
                    subjectSums[subject] += score;
                    subjectCounts[subject]++;
                }
            });
            
            // Check if this is the top performer
            if (studentCount > 0) {
                const studentAvg = studentSum / studentCount;
                if (studentAvg > topScore) {
                    topScore = studentAvg;
                    topPerformer = student;
                }
            }
        });
        
        // Calculate best subject
        let bestSubject = '';
        let bestSubjectAvg = -1;
        
        for (const subject in subjectSums) {
            if (subjectCounts[subject] > 0) {
                const subjectAvg = subjectSums[subject] / subjectCounts[subject];
                if (subjectAvg > bestSubjectAvg) {
                    bestSubjectAvg = subjectAvg;
                    bestSubject = subject;
                }
            }
        }
        
        // Update DOM elements
        const overallAvgElement = document.getElementById('overall-average');
        if (overallAvgElement) {
            overallAvgElement.textContent = totalCount > 0 ? 
                `${(totalSum / totalCount).toFixed(2)}%` : 'N/A';
        }
        
        const topPerformerElement = document.getElementById('top-performer-name');
        if (topPerformerElement && topPerformer) {
            topPerformerElement.textContent = topPerformer.Name || 'N/A';
        }
        
        const bestSubjectElement = document.getElementById('best-subject');
        if (bestSubjectElement) {
            bestSubjectElement.textContent = bestSubject || 'N/A';
        }
    }
    
    // Create overview section charts
    function createOverviewCharts() {
        createOverallDistributionChart();
        createSubjectAveragesChart();
        createTopStudentsChart();
    }
    
    // Create overall performance distribution chart
    function createOverallDistributionChart() {
        const chartElement = document.getElementById('overall-distribution-chart');
        if (!chartElement || studentData.length === 0) return;
        
        // Calculate overall scores for each student
        const overallScores = studentData.map(student => {
            let sum = 0;
            let count = 0;
            
            subjects.forEach(subject => {
                if (student[subject] !== undefined && !isNaN(student[subject])) {
                    sum += parseFloat(student[subject]);
                    count++;
                }
            });
            
            return count > 0 ? sum / count : 0;
        });
        
        // Create histogram data
        const trace = {
            x: overallScores,
            type: 'histogram',
            marker: {
                color: 'rgba(0, 229, 255, 0.7)',
                line: {
                    color: 'rgba(0, 229, 255, 1)',
                    width: 1
                }
            },
            opacity: 0.7,
            nbinsx: 10
        };
        
        const layout = {
            title: 'Overall Score Distribution',
            xaxis: { title: 'Average Score (%)' },
            yaxis: { title: 'Number of Students' },
            bargap: 0.05,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 50, r: 30, b: 80, l: 80 },
            autosize: true
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, [trace], layout, config);
    }
    
    // Create subject averages chart
    function createSubjectAveragesChart() {
        const chartElement = document.getElementById('subject-averages-chart');
        if (!chartElement || studentData.length === 0) return;
        
        // Calculate subject averages
        const subjectAverages = {};
        
        subjects.forEach(subject => {
            let sum = 0;
            let count = 0;
            
            studentData.forEach(student => {
                if (student[subject] !== undefined && !isNaN(student[subject])) {
                    sum += parseFloat(student[subject]);
                    count++;
                }
            });
            
            subjectAverages[subject] = count > 0 ? sum / count : 0;
        });
        
        // Create bar chart data
        const trace = {
            x: Object.keys(subjectAverages),
            y: Object.values(subjectAverages),
            type: 'bar',
            marker: {
                color: 'rgba(0, 229, 255, 0.7)',
                line: {
                    color: 'rgba(0, 229, 255, 1)',
                    width: 1
                }
            }
        };
        
        const layout = {
            title: 'Subject Averages',
            xaxis: { title: 'Subject', automargin: true },
            yaxis: { title: 'Average Score (%)', range: [0, 100], automargin: true },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 50, r: 30, b: 100, l: 80 },
            autosize: true
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, [trace], layout, config);
    }
    
    // Create top students chart
    function createTopStudentsChart() {
        const chartElement = document.getElementById('top-students-chart');
        if (!chartElement || studentData.length === 0) return;
        
        // Calculate overall average for each student
        const studentAverages = studentData.map(student => {
            let sum = 0;
            let count = 0;
            
            subjects.forEach(subject => {
                if (student[subject] !== undefined && !isNaN(student[subject])) {
                    sum += parseFloat(student[subject]);
                    count++;
                }
            });
            
            return {
                name: student.Name || 'Unknown',
                average: count > 0 ? sum / count : 0
            };
        });
        
        // Sort and get top 10
        const topStudents = studentAverages
            .sort((a, b) => b.average - a.average)
            .slice(0, 10);
        
        // Create horizontal bar chart
        const trace = {
            y: topStudents.map(student => student.name),
            x: topStudents.map(student => student.average),
            type: 'bar',
            orientation: 'h',
            marker: {
                color: 'rgba(0, 229, 255, 0.7)',
                line: {
                    color: 'rgba(0, 229, 255, 1)',
                    width: 1
                }
            }
        };
        
        const layout = {
            title: 'Top 10 Students',
            xaxis: { title: 'Average Score (%)', range: [0, 100] },
            yaxis: { 
                title: '',
                automargin: true
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 50, r: 30, b: 50, l: 150 },
            autosize: true
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, [trace], layout, config);
    }
    
    // Initialize event listeners
    function initializeEventListeners() {
        // Navigation tabs
        const navLinks = document.querySelectorAll('nav a');
        const sections = document.querySelectorAll('.dashboard-section');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                if (this.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    
                    const targetId = this.getAttribute('href').substring(1);
                    
                    // Update active class on navigation
                    navLinks.forEach(link => link.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Show target section, hide others
                    sections.forEach(section => {
                        if (section.id === targetId) {
                            section.classList.add('active');
                            // Trigger resize event to redraw charts
                            window.dispatchEvent(new Event('resize'));
                        } else {
                            section.classList.remove('active');
                        }
                    });
                }
            });
        });
        
        // Subject selector
        const subjectSelect = document.getElementById('subject-select');
        if (subjectSelect) {
            subjectSelect.addEventListener('change', function() {
                currentSubject = this.value;
                updateSubjectAnalysis(currentSubject);
            });
        }
        
        // Add window resize event listener to redraw charts
        window.addEventListener('resize', function() {
            const activeSection = document.querySelector('.dashboard-section.active');
            if (activeSection) {
                const charts = activeSection.querySelectorAll('.chart');
                charts.forEach(chart => {
                    if (chart.id && chart._fullLayout) {
                        Plotly.relayout(chart.id, {
                            'xaxis.autorange': true,
                            'yaxis.autorange': true
                        });
                    }
                });
            }
        });
    }
    
    // Update subject analysis section
    function updateSubjectAnalysis(subject) {
        if (!subject || studentData.length === 0) return;
        
        // Create subject distribution chart
        createSubjectDistributionChart(subject);
        
        // Create subject metrics chart
        createSubjectMetricsChart(subject);
        
        // Create 3D score landscape
        createSubject3DLandscape(subject);
        
        // Initialize student analysis section
        initializeStudentAnalysis();
        
        // Initialize correlations section
        initializeCorrelationsSection();
    }
    
    // Create subject distribution chart
    function createSubjectDistributionChart(subject) {
        const chartElement = document.getElementById('subject-distribution-chart');
        if (!chartElement) return;
        
        // Get all scores for the subject
        const scores = studentData
            .map(student => student[subject])
            .filter(score => score !== undefined && !isNaN(score))
            .map(score => parseFloat(score));
        
        // Define score ranges
        const ranges = [
            { min: 90, max: 100, label: '90-100' },
            { min: 80, max: 89, label: '80-89' },
            { min: 70, max: 79, label: '70-79' },
            { min: 60, max: 69, label: '60-69' },
            { min: 50, max: 59, label: '50-59' },
            { min: 40, max: 49, label: '40-49' },
            { min: 30, max: 39, label: '30-39' },
            { min: 0, max: 29, label: '0-29' }
        ];
        
        // Count students in each range
        const rangeCounts = ranges.map(range => ({
            range: range.label,
            count: scores.filter(score => score >= range.min && score <= range.max).length
        }));
        
        // Create bar chart
        const trace = {
            x: rangeCounts.map(r => r.range),
            y: rangeCounts.map(r => r.count),
            type: 'bar',
            marker: {
                color: 'rgba(0, 229, 255, 0.7)',
                line: {
                    color: 'rgba(0, 229, 255, 1)',
                    width: 1
                }
            }
        };
        
        const layout = {
            title: `${subject} Score Distribution`,
            xaxis: { 
                title: 'Score Range',
                type: 'category',
                automargin: true
            },
            yaxis: { 
                title: 'Number of Students',
                automargin: true
            },
            bargap: 0.2,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 50, r: 20, b: 80, l: 80 }
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, [trace], layout, config);
    }
    
    // Create subject metrics chart
    function createSubjectMetricsChart(subject) {
        const chartElement = document.getElementById('subject-metrics-chart');
        if (!chartElement) return;
        
        // Get all scores for the subject
        const scores = studentData
            .map(student => student[subject])
            .filter(score => score !== undefined && !isNaN(score))
            .map(score => parseFloat(score));
        
        if (scores.length === 0) return;
        
        // Calculate metrics
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const median = calculateMedian(scores);
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        
        // Create gauge charts
        const gaugeConfig = {
            domain: { x: [0, 1], y: [0, 1] },
            value: average,
            title: { text: "Average" },
            type: "indicator",
            mode: "gauge+number",
            gauge: {
                axis: { range: [0, 100] },
                bar: { color: "rgba(0, 229, 255, 0.7)" },
                bgcolor: "rgba(0, 0, 0, 0.3)",
                borderwidth: 2,
                bordercolor: "rgba(255, 255, 255, 0.3)",
                steps: [
                    { range: [0, 50], color: "rgba(255, 0, 0, 0.3)" },
                    { range: [50, 70], color: "rgba(255, 255, 0, 0.3)" },
                    { range: [70, 100], color: "rgba(0, 255, 0, 0.3)" }
                ],
            }
        };
        
        const medianGauge = JSON.parse(JSON.stringify(gaugeConfig));
        medianGauge.value = median;
        medianGauge.title.text = "Median";
        
        const minGauge = JSON.parse(JSON.stringify(gaugeConfig));
        minGauge.value = min;
        minGauge.title.text = "Minimum";
        
        const maxGauge = JSON.parse(JSON.stringify(gaugeConfig));
        maxGauge.value = max;
        maxGauge.title.text = "Maximum";
        
        const layout = {
            grid: { rows: 2, columns: 2, pattern: "independent" },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 40, r: 20, b: 20, l: 20 }
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, [gaugeConfig, medianGauge, minGauge, maxGauge], layout, config);
    }
    
    // Create 3D score landscape
    function createSubject3DLandscape(subject) {
        const chartElement = document.getElementById('subject-3d-landscape');
        if (!chartElement) return;
        
        // Clear previous chart
        chartElement.innerHTML = '';
        
        // Get scores for the subject
        const scores = [];
        const names = [];
        
        studentData.forEach(student => {
            if (student[subject] !== undefined && !isNaN(student[subject])) {
                scores.push(parseFloat(student[subject]));
                names.push(student.Name || 'Unknown');
            }
        });
        
        if (scores.length === 0) return;
        
        // Create 3D surface plot
        const size = Math.ceil(Math.sqrt(scores.length));
        const z = [];
        let nameIndex = 0;
        
        // Create grid data
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                if (nameIndex < scores.length) {
                    row.push(scores[nameIndex]);
                    nameIndex++;
                } else {
                    row.push(0);
                }
            }
            z.push(row);
        }
        
        // Create x and y coordinates
        const x = Array.from({ length: size }, (_, i) => i);
        const y = Array.from({ length: size }, (_, i) => i);
        
        // Create surface plot
        const data = [{
            type: 'surface',
            x: x,
            y: y,
            z: z,
            colorscale: 'Viridis',
            contours: {
                z: {
                    show: true,
                    usecolormap: true,
                    highlightcolor: "#42f462",
                    project: { z: true }
                }
            },
            hovertemplate: 'Score: %{z}<extra></extra>'
        }];
        
        const layout = {
            title: `${subject} 3D Score Landscape`,
            scene: {
                xaxis: { title: '', showgrid: false, zeroline: false, showticklabels: false },
                yaxis: { title: '', showgrid: false, zeroline: false, showticklabels: false },
                zaxis: { title: 'Score', range: [0, 100] },
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1 }
                }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 50, r: 20, b: 20, l: 20 },
            autosize: true,
            height: 500
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, data, layout, config);
    }
    
    // Initialize student analysis section
    function initializeStudentAnalysis() {
        // Set up student dropdown functionality
        setupStudentDropdown();
    }
    
    // Set up student dropdown functionality
    function setupStudentDropdown() {
        const studentDropdown = document.getElementById('student-dropdown');
        if (!studentDropdown) return;
        
        // Clear existing options except the default one
        studentDropdown.innerHTML = '<option value="">Select a student...</option>';
        
        // Add student names to dropdown
        studentData
            .map(student => student.Name)
            .filter(name => name) // Filter out undefined or empty names
            .sort() // Sort alphabetically
            .forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                studentDropdown.appendChild(option);
            });
        
        // Add change event listener
        studentDropdown.addEventListener('change', function() {
            const selectedName = this.value;
            if (!selectedName) return;
            
            const selectedStudent = studentData.find(student => student.Name === selectedName);
            if (!selectedStudent) return;
            
            // Update student profile
            updateStudentProfile(selectedStudent);
            
            // Create student visualizations
            createStudentVisualizations(selectedStudent);
        });
    }
    
    // Update student profile information
    function updateStudentProfile(student) {
        const nameElement = document.getElementById('student-name');
        if (nameElement) {
            nameElement.textContent = student.Name;
        }
    }
    
    // Create student visualizations
    function createStudentVisualizations(student) {
        createStudentRadarChart(student);
        createStudentComparisonChart(student);
        createStudent3DChart(student);
    }
    
    // Display student profile
    function displayStudentProfile(student) {
        if (!student) return;
        
        // Update profile info
        const nameElement = document.getElementById('student-name');
        const idElement = document.getElementById('student-id');
        
        if (nameElement) nameElement.textContent = student.Name || 'Unknown';
        if (idElement) idElement.textContent = `ID: ${student.ID || 'N/A'}`;
        
        // Create student charts
        createStudentRadarChart(student);
        createStudentComparisonChart(student);
        createStudent3DChart(student);
    }
    
    // Create student radar chart
    function createStudentRadarChart(student) {
        const chartElement = document.getElementById('student-radar-chart');
        if (!chartElement || !student) return;
        
        // Get student scores for each subject
        const scores = [];
        const subjectLabels = [];
        
        subjects.forEach(subject => {
            if (student[subject] !== undefined && !isNaN(student[subject])) {
                scores.push(parseFloat(student[subject]));
                subjectLabels.push(subject);
            }
        });
        
        if (scores.length === 0) return;
        
        // Create radar chart
        const trace = {
            type: 'scatterpolar',
            r: scores,
            theta: subjectLabels,
            fill: 'toself',
            fillcolor: 'rgba(0, 229, 255, 0.2)',
            line: {
                color: 'rgba(0, 229, 255, 0.8)',
                width: 2
            },
            name: student.Name || 'Unknown'
        };
        
        const layout = {
            polar: {
                radialaxis: {
                    visible: true,
                    range: [0, 100]
                }
            },
            showlegend: false,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 30, r: 30, b: 30, l: 30 }
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, [trace], layout, config);
    }
    
    // Create student comparison chart
    function createStudentComparisonChart(student) {
        const chartElement = document.getElementById('student-comparison-chart');
        if (!chartElement || !student) return;
        
        // Get student scores and class averages
        const studentScores = [];
        const classAverages = [];
        const subjectLabels = [];
        
        subjects.forEach(subject => {
            if (student[subject] !== undefined && !isNaN(student[subject])) {
                // Add student score
                studentScores.push(parseFloat(student[subject]));
                
                // Calculate class average for this subject
                let sum = 0;
                let count = 0;
                
                studentData.forEach(s => {
                    if (s[subject] !== undefined && !isNaN(s[subject])) {
                        sum += parseFloat(s[subject]);
                        count++;
                    }
                });
                
                const average = count > 0 ? sum / count : 0;
                classAverages.push(average);
                subjectLabels.push(subject);
            }
        });
        
        if (studentScores.length === 0) return;
        
        // Create bar chart
        const studentTrace = {
            x: subjectLabels,
            y: studentScores,
            type: 'bar',
            name: 'Student',
            marker: {
                color: 'rgba(0, 229, 255, 0.7)',
                line: {
                    color: 'rgba(0, 229, 255, 1)',
                    width: 1
                }
            }
        };
        
        const averageTrace = {
            x: subjectLabels,
            y: classAverages,
            type: 'bar',
            name: 'Class Average',
            marker: {
                color: 'rgba(255, 184, 108, 0.7)',
                line: {
                    color: 'rgba(255, 184, 108, 1)',
                    width: 1
                }
            }
        };
        
        const layout = {
            barmode: 'group',
            xaxis: { title: 'Subject' },
            yaxis: { title: 'Score (%)', range: [0, 100] },
            legend: { font: { color: '#ffffff' } },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 30, r: 30, b: 80, l: 60 }
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, [studentTrace, averageTrace], layout, config);
    }
    
    // Create student 3D chart
    function createStudent3DChart(student) {
        const chartElement = document.getElementById('student-3d-chart');
        if (!chartElement || !student) return;
        
        // Clear previous chart
        chartElement.innerHTML = '';
        
        // Get student scores
        const scores = [];
        const subjectLabels = [];
        
        subjects.forEach(subject => {
            if (student[subject] !== undefined && !isNaN(student[subject])) {
                scores.push(parseFloat(student[subject]));
                subjectLabels.push(subject);
            }
        });
        
        if (scores.length < 3) {
            chartElement.innerHTML = '<p class="no-data">Not enough subjects for 3D visualization</p>';
            return;
        }
        
        // Create 3D scatter plot with mesh
        const trace = {
            type: 'mesh3d',
            x: scores,
            y: Array.from({ length: scores.length }, (_, i) => i),
            z: Array.from({ length: scores.length }, (_, i) => Math.sin(i * 0.5) * 20 + 50),
            opacity: 0.8,
            color: 'rgba(0, 229, 255, 0.7)',
            hoverinfo: 'x+text',
            hovertext: subjectLabels,
            showscale: false
        };
        
        const pointsTrace = {
            type: 'scatter3d',
            mode: 'markers',
            x: scores,
            y: Array.from({ length: scores.length }, (_, i) => i),
            z: Array.from({ length: scores.length }, (_, i) => Math.sin(i * 0.5) * 20 + 50),
            marker: {
                size: 6,
                color: 'rgba(255, 255, 255, 1)',
                line: {
                    color: 'rgba(0, 229, 255, 1)',
                    width: 1
                }
            },
            text: subjectLabels,
            hoverinfo: 'x+text',
            hovertext: subjectLabels.map((subject, i) => `${subject}: ${scores[i]}%`)
        };
        
        const layout = {
            title: '3D Performance Profile',
            scene: {
                xaxis: { title: 'Score', range: [0, 100] },
                yaxis: { title: '', showticklabels: false },
                zaxis: { title: '', showticklabels: false },
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1 }
                }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 50, r: 20, b: 20, l: 20 }
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, [trace, pointsTrace], layout, config);
    }
    
    // Helper function to calculate median
    function calculateMedian(values) {
        if (values.length === 0) return 0;
        
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        } else {
            return sorted[middle];
        }
    }
    
    // Initialize correlations section
    function initializeCorrelationsSection() {
        // Create correlation matrix
        createCorrelationMatrix();
        
        // Set up subject pair analysis
        setupSubjectPairAnalysis();
        
        // Set up 3D correlation visualization
        setup3DCorrelationVisualization();
    }
    
    // Create correlation matrix chart
    function createCorrelationMatrix() {
        const chartElement = document.getElementById('correlation-matrix-chart');
        if (!chartElement || subjects.length < 2) return;
        
        // Calculate correlation matrix
        const correlationMatrix = calculateCorrelationMatrix();
        
        // Create heatmap
        const trace = {
            z: correlationMatrix,
            x: subjects,
            y: subjects,
            type: 'heatmap',
            colorscale: [
                [0, 'rgba(0, 0, 255, 0.8)'],
                [0.5, 'rgba(255, 255, 255, 0.8)'],
                [1, 'rgba(255, 0, 0, 0.8)']
            ],
            zmin: -1,
            zmax: 1,
            hoverongaps: false,
            hovertemplate: 'Correlation: %{z:.2f}<extra></extra>'
        };
        
        const layout = {
            title: 'Subject Correlation Matrix',
            xaxis: {
                title: '',
                automargin: true
            },
            yaxis: {
                title: '',
                automargin: true
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 50, r: 20, b: 80, l: 80 }
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, [trace], layout, config);
    }
    
    // Calculate correlation matrix
    function calculateCorrelationMatrix() {
        const matrix = [];
        
        // For each subject pair, calculate correlation
        for (let i = 0; i < subjects.length; i++) {
            const row = [];
            for (let j = 0; j < subjects.length; j++) {
                if (i === j) {
                    // Diagonal is always 1 (perfect correlation with self)
                    row.push(1);
                } else {
                    // Calculate correlation between subjects[i] and subjects[j]
                    row.push(calculateCorrelation(subjects[i], subjects[j]));
                }
            }
            matrix.push(row);
        }
        
        return matrix;
    }
    
    // Calculate correlation between two subjects
    function calculateCorrelation(subjectX, subjectY) {
        // Get paired scores (only students who have both subjects)
        const pairs = [];
        
        studentData.forEach(student => {
            const x = student[subjectX];
            const y = student[subjectY];
            
            if (x !== undefined && !isNaN(x) && y !== undefined && !isNaN(y)) {
                pairs.push({
                    x: parseFloat(x),
                    y: parseFloat(y)
                });
            }
        });
        
        if (pairs.length < 3) return 0; // Not enough data
        
        // Calculate means
        const sumX = pairs.reduce((sum, pair) => sum + pair.x, 0);
        const sumY = pairs.reduce((sum, pair) => sum + pair.y, 0);
        const meanX = sumX / pairs.length;
        const meanY = sumY / pairs.length;
        
        // Calculate correlation coefficient
        let numerator = 0;
        let denominatorX = 0;
        let denominatorY = 0;
        
        pairs.forEach(pair => {
            const diffX = pair.x - meanX;
            const diffY = pair.y - meanY;
            
            numerator += diffX * diffY;
            denominatorX += diffX * diffX;
            denominatorY += diffY * diffY;
        });
        
        const denominator = Math.sqrt(denominatorX * denominatorY);
        
        return denominator === 0 ? 0 : numerator / denominator;
    }
    
    // Set up subject pair analysis
    function setupSubjectPairAnalysis() {
        const subjectXSelect = document.getElementById('subject-x');
        const subjectYSelect = document.getElementById('subject-y');
        
        if (!subjectXSelect || !subjectYSelect) return;
        
        // Set default values if needed
        if (subjects.length >= 2) {
            subjectXSelect.value = subjects[0];
            subjectYSelect.value = subjects[1];
            
            // Create initial scatter plot
            createSubjectScatterPlot(subjects[0], subjects[1]);
        }
        
        // Add event listeners
        subjectXSelect.addEventListener('change', function() {
            createSubjectScatterPlot(this.value, subjectYSelect.value);
        });
        
        subjectYSelect.addEventListener('change', function() {
            createSubjectScatterPlot(subjectXSelect.value, this.value);
        });
    }
    
    // Create subject scatter plot
    function createSubjectScatterPlot(subjectX, subjectY) {
        const chartElement = document.getElementById('subject-scatter-chart');
        if (!chartElement) return;
        
        // Get paired data
        const x = [];
        const y = [];
        const text = [];
        
        studentData.forEach(student => {
            if (student[subjectX] !== undefined && !isNaN(student[subjectX]) &&
                student[subjectY] !== undefined && !isNaN(student[subjectY])) {
                x.push(parseFloat(student[subjectX]));
                y.push(parseFloat(student[subjectY]));
                text.push(student.Name || 'Unknown');
            }
        });
        
        if (x.length === 0) return;
        
        // Calculate correlation
        const correlation = calculateCorrelation(subjectX, subjectY);
        
        // Create scatter plot
        const trace = {
            x: x,
            y: y,
            mode: 'markers',
            type: 'scatter',
            text: text,
            marker: {
                size: 10,
                color: 'rgba(0, 229, 255, 0.7)',
                line: {
                    color: 'rgba(0, 229, 255, 1)',
                    width: 1
                }
            },
            hovertemplate: '%{text}<br>' + subjectX + ': %{x}%<br>' + subjectY + ': %{y}%<extra></extra>'
        };
        
        // Add trend line if there's correlation
        let traces = [trace];
        
        if (Math.abs(correlation) > 0.1 && x.length > 2) {
            // Simple linear regression for trend line
            const xSum = x.reduce((sum, val) => sum + val, 0);
            const ySum = y.reduce((sum, val) => sum + val, 0);
            const xySum = x.reduce((sum, val, i) => sum + val * y[i], 0);
            const xSquaredSum = x.reduce((sum, val) => sum + val * val, 0);
            
            const n = x.length;
            const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
            const intercept = (ySum - slope * xSum) / n;
            
            // Create line points
            const xLine = [0, 100];
            const yLine = xLine.map(val => slope * val + intercept);
            
            const lineTrace = {
                x: xLine,
                y: yLine,
                mode: 'lines',
                type: 'scatter',
                line: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    width: 2,
                    dash: 'dash'
                },
                hoverinfo: 'none'
            };
            
            traces.push(lineTrace);
        }
        
        const layout = {
            title: `${subjectX} vs ${subjectY} (r = ${correlation.toFixed(2)})`,
            xaxis: {
                title: subjectX,
                range: [0, 100]
            },
            yaxis: {
                title: subjectY,
                range: [0, 100]
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 50, r: 20, b: 60, l: 60 }
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, traces, layout, config);
    }
    
    // Set up 3D correlation visualization
    function setup3DCorrelationVisualization() {
        const subjectXSelect = document.getElementById('subject-x-3d');
        const subjectYSelect = document.getElementById('subject-y-3d');
        const subjectZSelect = document.getElementById('subject-z-3d');
        
        if (!subjectXSelect || !subjectYSelect || !subjectZSelect) return;
        
        // Set default values if needed
        if (subjects.length >= 3) {
            subjectXSelect.value = subjects[0];
            subjectYSelect.value = subjects[1];
            subjectZSelect.value = subjects[2];
            
            // Create initial 3D scatter plot
            create3DCorrelationPlot(subjects[0], subjects[1], subjects[2]);
        }
        
        // Add event listeners
        subjectXSelect.addEventListener('change', function() {
            create3DCorrelationPlot(this.value, subjectYSelect.value, subjectZSelect.value);
        });
        
        subjectYSelect.addEventListener('change', function() {
            create3DCorrelationPlot(subjectXSelect.value, this.value, subjectZSelect.value);
        });
        
        subjectZSelect.addEventListener('change', function() {
            create3DCorrelationPlot(subjectXSelect.value, subjectYSelect.value, this.value);
        });
    }
    
    // Create 3D correlation plot
    function create3DCorrelationPlot(subjectX, subjectY, subjectZ) {
        const chartElement = document.getElementById('correlation-3d-chart');
        if (!chartElement) return;
        
        // Get data points
        const x = [];
        const y = [];
        const z = [];
        const text = [];
        
        studentData.forEach(student => {
            if (student[subjectX] !== undefined && !isNaN(student[subjectX]) &&
                student[subjectY] !== undefined && !isNaN(student[subjectY]) &&
                student[subjectZ] !== undefined && !isNaN(student[subjectZ])) {
                x.push(parseFloat(student[subjectX]));
                y.push(parseFloat(student[subjectY]));
                z.push(parseFloat(student[subjectZ]));
                text.push(student.Name || 'Unknown');
            }
        });
        
        if (x.length < 3) {
            chartElement.innerHTML = '<p class="no-data">Not enough data for 3D visualization</p>';
            return;
        }
        
        // Create 3D scatter plot
        const trace = {
            x: x,
            y: y,
            z: z,
            mode: 'markers',
            type: 'scatter3d',
            text: text,
            marker: {
                size: 6,
                color: z,
                colorscale: 'Viridis',
                opacity: 0.8,
                line: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    width: 0.5
                },
                colorbar: {
                    title: subjectZ,
                    titleside: 'right'
                }
            },
            hovertemplate: '%{text}<br>' +
                subjectX + ': %{x}%<br>' +
                subjectY + ': %{y}%<br>' +
                subjectZ + ': %{z}%<extra></extra>'
        };
        
        const layout = {
            title: '3D Subject Correlation',
            scene: {
                xaxis: { title: subjectX, range: [0, 100] },
                yaxis: { title: subjectY, range: [0, 100] },
                zaxis: { title: subjectZ, range: [0, 100] },
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1 }
                }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#ffffff' },
            margin: { t: 50, r: 20, b: 20, l: 20 },
            autosize: true,
            height: 500
        };
        
        const config = { responsive: true, autosize: true };
        
        Plotly.newPlot(chartElement, [trace], layout, config);
    }
    
    // Start fetching data when page loads
    fetchData();
});