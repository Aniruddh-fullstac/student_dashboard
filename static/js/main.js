document.addEventListener('DOMContentLoaded', function() {
    // File input handling
    const fileInput = document.getElementById('file');
    const fileLabel = document.querySelector('.file-label span');
    const fileName = document.querySelector('.file-name');
    
    fileInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            fileName.textContent = this.files[0].name;
            fileLabel.textContent = 'File selected';
        } else {
            fileName.textContent = 'No file selected';
            fileLabel.textContent = 'Choose a file';
        }
    });
    
    // Add parallax effect to stars background
    document.addEventListener('mousemove', function(e) {
        const stars = document.querySelector('.stars');
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        stars.style.transform = `translate(-${x * 20}px, -${y * 20}px)`;
    });
    
    // Add 3D tilt effect to cards
    const cards = document.querySelectorAll('.upload-card, .feature');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const angleX = (y - centerY) / 20;
            const angleY = (centerX - x) / 20;
            
            this.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        });
    });
    
    // Form validation
    const uploadForm = document.querySelector('.upload-form');
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            if (fileInput.files.length === 0) {
                e.preventDefault();
                alert('Please select a file to upload');
            }
        });
    }
});