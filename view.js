let playButton, pauseButton, resetButton, dimInput, fileInput;

function setup() {
    // Create play button
    playButton = createButton('');
    playButton.position(10, 10);
    playButton.mousePressed(playAnimation);
    playButton.elt.innerHTML = '<i class="fas fa-play"></i>'; // Place icon inside the button
    
    // Create pause button
    pauseButton = createButton('');
    pauseButton.position(10, 70);
    pauseButton.mousePressed(pauseAnimation);   
    pauseButton.elt.innerHTML = '<i class="fas fa-pause"></i>'; // Place icon inside the button
    
    // Create reset button
    resetButton = createButton('');
    resetButton.position(10, 130);
    resetButton.mousePressed(resetAnimation);  
    resetButton.elt.innerHTML = '<i class="fas fa-undo"></i>'; // Place icon inside the button

    // Create dimension input
    dimInput = createInput('');
    dimInput.position(10, 200);
    dimInput.input(updateDim);  
    dimInput.changed(validateInput)
    dimInput.attribute('placeholder', 'Enter dimension'); // Set placeholder text
    
    // Create file input
    fileInput = createFileInput(handleFile);
    fileInput.position(10, 260);
    fileInput.style('display', 'block'); 
}

function playAnimation() {
    // Code to play the animation
    console.log('play');
}

function pauseAnimation() {
    // Code to pause the animation
    console.log('pause');
}

function resetAnimation() {
    // Code to reset the animation
    console.log('reset');
}

function updateDim() {
    // Code to update the dimensions
    //   DIM = this.value();
    console.log('update dim with: ' + this.value());
}

function validateInput() {
    // Check if the input value is an integer
    if (!/^\d+$/.test(this.value())) {
        // If it's not an integer, underline the input text in red
        this.style('border-bottom', '3px solid red');
    } else {
        // If it's an integer, remove the red underline
        this.style('border-bottom', 'none');
    }
}

function handleFile(file) {
    // Code to handle the file upload
    console.log('file uploaded');
}

