let playButton, pauseButton, resetButton, dimInput, fileInput;

function setupView() {
    // --- CANVAS ---

    // Get dimensions of the user's screen
    const userWidth = window.innerWidth - 20;
    const userHeight = window.innerHeight - 20;
    createCanvas(userWidth, userHeight);

    // Give an initial text to overlay on the example image
    const exampleText = createP('Example');
    exampleText.style('font-size', '80px');
    exampleText.style('color', 'rgba(0,0,0,0.3)');
    exampleText.position(100, 100);
    exampleText.id('example-text');



    // --- INPUT IMAGE PARAMETERS ---

    // Create file input
    fileInput = createFileInput(handleFile);
    fileInput.position(100, 480);
    fileInput.style('display', 'block'); 
    fileInput.attribute('accept', '.png');

    function handleFile(file) {
        print("user submitted file: ", file.name);

        // TODO check if file is an image
        if (file.type === 'image') {
            inputImage = loadImage(file.data, () => {
                parseImage();
                if (select('#example-text')) {
                    select('#example-text').remove();
                }
            });
        } else {
            inputImage = null;
        }
    }

    // Create tile pixel size input box
    tileSizeInput = createInput('');
    tileSizeInput.position(185, 540);
    tileSizeInput.style('width', '100px');
    tileSizeInput.input(() => {
        updateSliderFromInput(tileSizeSlider, tileSizeInput);
        updateTileSize();
    });
    tileSizeInput.changed(validateInput)
    tileSizeInput.attribute('placeholder', 'Tile Size'); // Set placeholder text
    const px = createP('px');
    px.position(290, 545);

    // Create tile pixel size slider
    tileSizeSlider = createSlider(0, 100, 0);
    tileSizeSlider.position(160, 600);
    tileSizeSlider.style('width', '145px');
    tileSizeSlider.input(() => {
        updateInputFromSlider(tileSizeInput, tileSizeSlider);
        updateTileSize();
    });
    tileSizeSlider.hide();

    

    // --- OUTPUT IMAGE PARAMETERS ---

    // Create play button
    const buttonX = 500;
    const startButtonY = 100;
    playButton = createButton('');
    playButton.position(buttonX, startButtonY);
    playButton.mousePressed(playAnimation);
    playButton.elt.innerHTML = '<i class="fas fa-play"></i>'; // Place icon inside the button
    
    // Create pause button
    // pauseButton = createButton('');
    // pauseButton.position(buttonX, startButtonY + 60);
    // pauseButton.mousePressed(pauseAnimation);   
    // pauseButton.elt.innerHTML = '<i class="fas fa-pause"></i>'; // Place icon inside the button
    
    // Create reset button
    resetButton = createButton('');
    resetButton.position(buttonX, startButtonY + 120);
    resetButton.mousePressed(resetAnimation);  
    resetButton.elt.innerHTML = '<i class="fas fa-undo"></i>'; // Place icon inside the button

    // Create dimension input box
    dimInput = createInput('');
    dimInput.position(865, 540);
    dimInput.style('width', '120px');
    dimInput.input(() => {
        updateSliderFromInput(dimSlider, dimInput);
        updateDim();
    });
    dimInput.changed(validateInput)
    dimInput.attribute('placeholder', 'Dimensions'); // Set placeholder text

    // Create dimension slider
    dimSlider = createSlider(0, 100, 0);
    dimSlider.position(850, 600);
    dimSlider.style('width', '145px');
    dimSlider.input(() => {
        updateInputFromSlider(dimInput, dimSlider);
        updateDim();
    });
    dimSlider.hide();

    // Create a loading bar for the progress of the algorithm
    // loadingBar = createDiv('');
    // loadingBar.position(100, 650);
    // loadingBar.style('width', '1000px');
    // loadingBar.style('height', '20px');
    // loadingBar.class('loading-bar');




    // --- DOWNLOAD BUTTONS ---

    // Create a download image button
    const saveButton = createButton('Download Image <br>');
    saveButton.elt.innerHTML += '<i class="fas fa-download"></i>'; // Place icon inside the button
    saveButton.position(1050, 600);
    saveButton.style('width', '120px');
    saveButton.style('font-size', '12px');
    // saveButton.hide();
    saveButton.mousePressed(() => {
        
    });

    // Create a download tilemap json button
    const saveTilemapButton = createButton('Download Tilemap <br>');
    saveTilemapButton.elt.innerHTML += '<i class="fas fa-download"></i>'; // Place icon inside the button
    saveTilemapButton.position(1200, 600);
    saveTilemapButton.style('width', '120px');
    saveTilemapButton.style('font-size', '12px');
    // saveTilemapButton.hide();
    saveTilemapButton.mousePressed(() => {
        
    });


    // Create GitHub link to the repo
    const githubLink = createA('https://github.com/NathanHinthorne/Wave-Function-Collapse?tab=readme-ov-file', 'GitHub Repository ');
    githubLink.position(10, 655);
    githubLink.class('github-link');
    githubLink.elt.innerHTML += '<i class="fab fa-github"></i>'; // Place icon inside the button
    githubLink.style('width', '145px');
}

function playAnimation() {
    // 
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
    if (!isNaN(dimInput.value())) {
        dim = parseInt(dimInput.value());
    }
}

function updateTileSize() {
    if (!isNaN(tileSizeInput.value())) {
        if (tileSizeInput.value() >= 10) {
            tilePixelSize = parseFloat(tileSizeInput.value());
            parseImage();

            const error = select('#tile-size-error');
            error.remove();
        } else {
            // show red text saying "Tile size must be at least 10px"            
            let errorText = createP('Tile size must be at least 10px');
            const error = select('#tile-size-error');
            if (error) {
                error.remove();
            }
            errorText.style('color', 'red');
            errorText.position(140, 610);
            errorText.id('tile-size-error');
        }
    }
}

function validateInput() {
    let num = parseInt(this.value());
    if (isNaN(num)) {
        this.value(''); // Clear the input
    }
}

function updateSliderFromInput(slider, input) {
    let num = parseInt(input.value());
    if (!isNaN(num)) {
        slider.show();
        
        const maxVal = input.value() * 1.5;
        slider.elt.max = maxVal;
        const minVal = Math.floor(input.value() / 2);
        slider.elt.min = minVal;

        slider.value(num);
    } else {
        slider.hide();
    }
}

function updateInputFromSlider(input, slider) {
    input.value(slider.value());
}