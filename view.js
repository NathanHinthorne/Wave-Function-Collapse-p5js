let analyzeButton, playButton, pauseButton, resetButton, dimInput, fileInput, tileSizeInput,
    tileSizeSlider, dimSlider, loadingBar, saveImageButton, saveTilemapButton, githubLink, helpButton, helpMenu;


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
    analyzeButton = createButton('Analyze');
    analyzeButton.position(buttonX, 60);
    analyzeButton.mousePressed(analyze);
    analyzeButton.style('width', '120px');

    const firstButton = 220;

    // Create play button
    playButton = createButton('');
    playButton.position(buttonX, firstButton + 60);
    playButton.mousePressed(handlePlay);
    playButton.elt.innerHTML = '<i class="fas fa-play"></i>'; // Place icon inside the button
    playButton.disabled = true; // Disable the button until the image is analyzed
    playButton.class('grayed-out');

    // Create pause button
    pauseButton = createButton('');
    pauseButton.position(buttonX, firstButton + 120);
    pauseButton.mousePressed(handlePause);   
    pauseButton.elt.innerHTML = '<i class="fas fa-pause"></i>'; // Place icon inside the button
    pauseButton.disabled = true; // Disable the button until the image is analyzed
    pauseButton.class('grayed-out');
    
    // Create reset button
    resetButton = createButton('');
    resetButton.position(buttonX, firstButton + 180);
    resetButton.mousePressed(handleReset);  
    resetButton.elt.innerHTML = '<i class="fas fa-undo"></i>'; // Place icon inside the button
    resetButton.disabled = true; // Disable the button until the image is analyzed
    resetButton.class('grayed-out');

    // Create dimension input box
    dimInput = createInput('');
    dimInput.position(505, 140);
    dimInput.style('width', '120px');
    dimInput.input(() => {
        updateSliderFromInput(dimSlider, dimInput);
        updateDim();
    });
    dimInput.changed(validateInput)
    dimInput.attribute('placeholder', 'Dimensions'); // Set placeholder text

    // Create dimension slider
    dimSlider = createSlider(0, 100, 0);
    dimSlider.position(490, 200);
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
    saveImageButton = createButton('Download Image <br>');
    saveImageButton.elt.innerHTML += '<i class="fas fa-download"></i>'; // Place icon inside the button
    saveImageButton.position(1050, 600);
    saveImageButton.style('width', '120px');
    saveImageButton.style('font-size', '12px');
    // saveButton.hide();
    saveImageButton.mousePressed(handleImageDownload);

    // Create a download tilemap json button
    saveTilemapButton = createButton('Download Tilemap <br>');
    saveTilemapButton.elt.innerHTML += '<i class="fas fa-download"></i>'; // Place icon inside the button
    saveTilemapButton.position(1200, 600);
    saveTilemapButton.style('width', '120px');
    saveTilemapButton.style('font-size', '12px');
    // saveTilemapButton.hide();
    saveTilemapButton.mousePressed(handleTilemapDownload);
    enableDownloadButton(false);


    // Create GitHub link to the repo
    githubLink = createA('https://github.com/NathanHinthorne/Wave-Function-Collapse?tab=readme-ov-file', 'GitHub Repository ');
    githubLink.position(10, 655);
    githubLink.class('github-link');
    githubLink.elt.innerHTML += '<i class="fab fa-github"></i>'; // Place icon inside the button
    githubLink.style('width', '145px');

    // Create a help menu
    // displayHelpMenu(700, 10, 400, 400);
}


function analyze() {
    analyzeTiles();
    imageIsAnalyzed = true;
    enableEditButtons(true);
}

function handlePlay() {
    startOver();
    isPlaying = true;
    console.log("Generating output...");
}

function handlePause() {
    isPlaying = false;
    console.log("Pausing output generation...");
}

function handleReset() {
    startOver();
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
            outputIsPrepared = false;
            enableEditButtons(false);
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
    outputIsPrepared = false;
    enableEditButtons(false);

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

function handleImageDownload() {
    //TODO save an image of the displayed output grid

    const test = createGraphics(400, 400);
    test.background(255);
    test.fill(0);
    test.textSize(32);
    test.text('Hello', 10, 50);
    test.save('test.png');
}

function handleTilemapDownload() {
    //TODO save each tile, which is cell.options[0], in the output grid to a json file

    const test = {
        "tilemap": [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8]
        ]
    };

    saveJSON(test, 'test.json');
}

function enableEditButtons(isEnabled) {
    if (isEnabled) {
        playButton.disabled = false;
        resetButton.disabled = false;
        pauseButton.disabled = false;
        playButton.removeClass('grayed-out');
        pauseButton.removeClass('grayed-out');
        resetButton.removeClass('grayed-out');
    } else {
        playButton.disabled = true;
        resetButton.disabled = true;
        pauseButton.disabled = true;
        playButton.class('grayed-out');
        pauseButton.class('grayed-out');
        resetButton.class('grayed-out');
    }
}

function enableDownloadButton(isEnabled) {
    if (isEnabled) {
        saveImageButton.disabled = false;
        saveTilemapButton.disabled = false;
        saveImageButton.removeClass('grayed-out');
        saveTilemapButton.removeClass('grayed-out');
    } else {
        saveImageButton.disabled = true;
        saveTilemapButton.disabled = true;
        saveImageButton.class('grayed-out');
        saveTilemapButton.class('grayed-out');
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
    const tileDisplaySize = 30;
    const margin = 10;
    const spacing = tileDisplaySize / 10 + 1;
    const rowSpacing = 15;

    // Calculate rowSize based on the cardWidth
    const rowSize = Math.floor((cardWidth - 2 * margin) / (tileDisplaySize + spacing));

    let tileYPos = cardY + 30; // Adjust initial Y position to accommodate the title
    let tileXPos = cardX;

    const maxRows = Math.floor((cardHeight - 2 * margin) / (tileDisplaySize + spacing + rowSpacing));

    for (let i = 0; i < maxRows * rowSize && i < tileVariants.length; i++) {
        const tile = tileVariants[i];

        // Calculate the current row and column
        const row = Math.floor(i / rowSize);
        const col = i % rowSize;

        // Calculate the x and y position based on the row and column
        tileXPos = cardX + col * (tileDisplaySize + spacing) + margin;
        tileYPos = cardY + 30 + row * (tileDisplaySize + spacing + rowSpacing);

        image(tile.img, tileXPos, tileYPos, tileDisplaySize, tileDisplaySize);
        fill(0);
        textSize(8);
        text(i, tileXPos, tileYPos + tileDisplaySize + 10);

        // Draw black lines around the tile
        stroke(0);
        strokeWeight(1);
        noFill();
        rect(tileXPos, tileYPos, tileDisplaySize, tileDisplaySize);

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

function displayInputGrid(cardX, cardY, cardWidth, cardHeight) {
    const margin = 10;
    const spacing = tilePixelSize / 5 + 1;
    const maxTilesX = inputGrid[0].length;
    const maxTilesY = inputGrid.length;

    // Calculate the maximum tile size that would fit within the card's dimensions
    const tileDisplaySizeX = (cardWidth - 2 * margin - (maxTilesX - 1) * spacing) / maxTilesX;
    const tileDisplaySizeY = (cardHeight - 2 * margin - (maxTilesY - 1) * spacing) / maxTilesY;
    const tileDisplaySize = Math.min(tileDisplaySizeX, tileDisplaySizeY);

    // Draw a light gray background behind the input grid
    fill(230);
    noStroke();
    rect(cardX, cardY, cardWidth, cardHeight, 2);

    for (let y = 0; y < maxTilesY; y++) {
        for (let x = 0; x < maxTilesX; x++) {
            const tile = inputGrid[y][x];
            const xPos = cardX + x * (tileDisplaySize + spacing) + margin;
            const yPos = cardY + y * (tileDisplaySize + spacing) + margin;
            image(tile.img, xPos, yPos, tileDisplaySize, tileDisplaySize);

            // Draw black lines around the tile
            stroke(0);
            strokeWeight(1);
            noFill();
            rect(xPos, yPos, tileDisplaySize, tileDisplaySize);
        }
    }
}

function displayOutputGrid(cardX, cardY, cardWidth, cardHeight) {
    const margin = 10;
    const spacing = tilePixelSize / 5 + 1;
    const width = outputGrid.length;
    const height = outputGrid[0].length;

    // Calculate the maximum tile size that would fit within the grid's dimensions
    const tileDisplaySizeX = (cardWidth - 2 * margin - (width - 1) * spacing) / width;
    const tileDisplaySizeY = (cardHeight - 2 * margin - (height - 1) * spacing) / height;
    const tileDisplaySize = Math.min(tileDisplaySizeX, tileDisplaySizeY);

    // Draw a light gray background behind the input grid
    fill(230);
    noStroke();
    rect(cardX, cardY, cardWidth, cardHeight, 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let cell = outputGrid[y][x];
            const xPos = cardX + x * (tileDisplaySize + spacing) + margin;
            const yPos = cardY + y * (tileDisplaySize + spacing) + margin;
            if (cell.collapsed) {
                let index = cell.options[0]; // only one option when collapsed
                image(tileVariants[index].img, xPos, yPos, tileDisplaySize, tileDisplaySize);
            } else {
                // Draw black lines around the tile
                stroke(0);
                strokeWeight(1);
                noFill();
                rect(xPos, yPos, tileDisplaySize, tileDisplaySize);

                // Draw the entropy value in the center of the cell
                fill(0);
                textSize(10);
                strokeWeight(0);
                textAlign(CENTER, CENTER);
                text(cell.calculateEntropy(), xPos + tileDisplaySize / 2, yPos + tileDisplaySize / 2);
            }
        }
    }
}

function displayHelpMenu(cardX, cardY, cardWidth, cardHeight) {

    // Create a dropdown menu for the help menu that the user can click on
    helpMenu = createDiv('');
    helpMenu.id('help-menu'); // Assign an ID for CSS styling
    helpMenu.position(cardX, cardY); // Position the menu
    helpMenu.size(cardWidth, cardHeight); // Set the size of the menu

    // Create a title for the help menu
    const title = createP('Help');
    title.parent(helpMenu);

    // Create a paragraph for the help menu
    const helpText = createP(
        'This tool is used to generate images/tilemaps ' +
        'using patterns identified from an input image. ' +
        'To use, first upload an image composed of tiles ' +
        '(similar to the example below). Second, set the ' +
        'tile size. Third, click "Analyze" to generate ' +
        'tile variants. Finally, click "Play" to generate ' +
        'the tilemap.');
    helpText.parent(helpMenu);

    helpMenu.class('hide'); // Initially hide the menu

    // create a help button that will display the help menu when clicked
    helpButton = createButton('');
    helpButton.elt.innerHTML = '<i class="fas fa-question"></i>'; // Place icon inside the button
    helpButton.position(cardX + cardWidth + 10, cardY);
    helpButton.class('yellow-button')
    helpButton.mousePressed(() => {
        if (helpMenu.class().includes('hide')) {
            helpMenu.removeClass('hide'); // Remove 'hide' class to show the menu
        } else {
            helpMenu.class('hide'); // Add 'hide' class to hide the menu
        }
    });
}