let analyzeButton, playButton, pauseButton, resetButton, dimInput, fileInput;

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

    // Create an analyze button
    const buttonX = 500;
    const firstButton = 100;
    analyzeButton = createButton('Analyze');
    analyzeButton.position(buttonX, firstButton);
    analyzeButton.mousePressed(analyze);
    analyzeButton.style('width', '120px');

    // Create play button
    playButton = createButton('');
    playButton.position(buttonX, firstButton + 60);
    playButton.mousePressed(playAnimation);
    playButton.elt.innerHTML = '<i class="fas fa-play"></i>'; // Place icon inside the button
    playButton.disabled = true; // Disable the button until the image is analyzed
    playButton.class('grayed-out');

    // Create pause button
    // pauseButton = createButton('');
    // pauseButton.position(buttonX, startButtonY + 120);
    // pauseButton.mousePressed(pauseAnimation);   
    // pauseButton.elt.innerHTML = '<i class="fas fa-pause"></i>'; // Place icon inside the button
    
    // Create reset button
    resetButton = createButton('');
    resetButton.position(buttonX, firstButton + 180);
    resetButton.mousePressed(resetAnimation);  
    resetButton.elt.innerHTML = '<i class="fas fa-undo"></i>'; // Place icon inside the button
    resetButton.disabled = true; // Disable the button until the image is analyzed
    resetButton.class('grayed-out');

    // // Create dimension input box
    // dimInput = createInput('');
    // dimInput.position(865, 540);
    // dimInput.style('width', '120px');
    // dimInput.input(() => {
    //     updateSliderFromInput(dimSlider, dimInput);
    //     updateDim();
    // });
    // dimInput.changed(validateInput)
    // dimInput.attribute('placeholder', 'Dimensions'); // Set placeholder text

    // // Create dimension slider
    // dimSlider = createSlider(0, 100, 0);
    // dimSlider.position(850, 600);
    // dimSlider.style('width', '145px');
    // dimSlider.input(() => {
    //     updateInputFromSlider(dimInput, dimSlider);
    //     updateDim();
    // });
    // dimSlider.hide();

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

    // Create a link to my linked in
    // const linkedInLink = createA('https://www.linkedin.com/in/nathan-hinthorne/', 'LinkedIn ');
    // linkedInLink.position(180, 655);
    // linkedInLink.class('linkedin-link');
    // linkedInLink.elt.innerHTML += '<i class="fab fa-linkedin"></i>'; // Place icon inside the button
    // linkedInLink.style('width', '145px');
    
}

function analyze() {
    analyzeTiles();
    imageIsAnalyzed = true;
    enableButtons(true);
}

function playAnimation() {
    // startOver();
    // populateOutputGrid();
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
        if (tileSizeInput.value() >= 10 && tileSizeInput.value() <= 100){
            tilePixelSize = parseFloat(tileSizeInput.value());

            parseImage();
            imageIsAnalyzed = false;
            enableButtons(false);
            redraw();

            const error = select('#tile-size-error');
            error.remove();
        } else {
            let errorText = createP('Tile size must be between 10 and 100 pixels.');
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


function handleFile(file) {
    print("user submitted file: ", file.name);
    imageIsAnalyzed = false;
    enableButtons(false);

    // TODO check if file is an image
    if (file.type === 'image') {
        inputImage = loadImage(file.data, () => {
            parseImage();
            redraw();


            if (select('#example-text')) {
                select('#example-text').remove();
            }
        });
    } else {
        inputImage = null;
    }
}

function enableButtons(isEnabled) {
    if (isEnabled) {
        playButton.disabled = false;
        resetButton.disabled = false;
        playButton.removeClass('grayed-out');
        resetButton.removeClass('grayed-out');
    } else {
        playButton.disabled = true;
        resetButton.disabled = true;
        playButton.class('grayed-out');
        resetButton.class('grayed-out');
    }
}


function displayTileVariants(cardX, cardY, cardWidth, cardHeight) {
    // put a light gray background behind the tile variants
    fill(230);
    noStroke();
    rect(cardX, cardY, cardWidth, cardHeight, 2);

    fill(0);
    textSize(14);
    text("Tile Variants", cardX + 10, cardY + 20);

    // show the image associated with each tile variant, along with its index on the canvas
    const newTileDisplaySize = 30;
    const margin = 10;
    const spacing = newTileDisplaySize / 10 + 1;
    const rowSpacing = 15;

    // Calculate rowSize based on the cardWidth
    const rowSize = Math.floor((cardWidth - 2 * margin) / (newTileDisplaySize + spacing));

    let tileYPos = cardY + 30; // Adjust initial Y position to accommodate the title
    let tileXPos = cardX;

    const maxRows = Math.floor((cardHeight - 2 * margin) / (newTileDisplaySize + spacing + rowSpacing));

    for (let i = 0; i < maxRows * rowSize && i < tileVariants.length; i++) {
        const tile = tileVariants[i];

        // Calculate the current row and column
        const row = Math.floor(i / rowSize);
        const col = i % rowSize;

        // Calculate the x and y position based on the row and column
        tileXPos = cardX + col * (newTileDisplaySize + spacing) + margin;
        tileYPos = cardY + 30 + row * (newTileDisplaySize + spacing + rowSpacing);

        image(tile.img, tileXPos, tileYPos, newTileDisplaySize, newTileDisplaySize);
        fill(0);
        textSize(8);
        text(i, tileXPos, tileYPos + newTileDisplaySize + 10);

        // Draw black lines around the tile
        stroke(0);
        strokeWeight(1);
        noFill();
        rect(tileXPos, tileYPos, newTileDisplaySize, newTileDisplaySize);

        // Reset fill, stroke, and strokeWeight for the next iteration
        fill(255);
        stroke(255);
        strokeWeight(0);
    }

    // show ... if there are more than maxRows rows
    if (tileVariants.length > maxRows * rowSize) {
        fill(0);
        textSize(18);
        text("...", cardX + 10, cardY + cardHeight - 5);
    }
}