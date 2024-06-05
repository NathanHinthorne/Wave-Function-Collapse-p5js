/**
 * Contains the functions for setting up the view of the application, including the canvas, buttons, sliders, and input fields.
 * 
 * @author Nathan Hinthorne
 */

let analyzeButton, playButton, pauseButton, resetButton,
    dimInput, fileInput, tileSizeInput, tileSizeSlider,
    dimSlider, loadingBar, saveImageButton, saveTilemapButton,
    saveRulesButton, githubLink, oscillator, envelope,
    frameRateSlider;


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


    // --- SFX ---
    // oscillator = new p5.Oscillator('sine');
    // envelope = new p5.Envelope(); // Create a new envelope
    // const attackTime = 0.1;
    // const decayTime = 0.1;
    // const susPercent = 0.2;
    // const releaseTime = 0.5;
    // const attackLevel = 1.0;
    // const releaseLevel = 0;

    // envelope.setADSR(attackTime, decayTime, susPercent, releaseTime);
    // envelope.setRange(attackLevel, releaseLevel);

    // oscillator.amp(envelope);  // Use the envelope to control the amplitude



    // --- INPUT IMAGE PARAMETERS ---

    const inputParamsStartY = 480;

    // Create file input
    fileInput = createFileInput(handleFile);
    fileInput.position(100, inputParamsStartY);
    fileInput.style('display', 'block');
    fileInput.attribute('accept', '.jpg, .jpeg, .png');

    // Create tile pixel size input box
    tileSizeInput = createInput('');
    tileSizeInput.position(185, inputParamsStartY + 60);
    tileSizeInput.style('width', '100px');
    tileSizeInput.input(() => {
        updateSliderFromInput(tileSizeSlider, tileSizeInput);
        updateTileSize();
    });
    tileSizeInput.changed(validateInput)
    tileSizeInput.attribute('placeholder', 'Tile Size'); // Set placeholder text
    const px = createP('px');
    px.position(290, inputParamsStartY + 65);
    tileSizeInput.elt.addEventListener('input', updateLabelPosition);

    // Create tile pixel size slider
    tileSizeSlider = createSlider(0, 100, 0);
    tileSizeSlider.position(160, inputParamsStartY + 120);
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
    playButton.style('width', '80px');
    playButton.attribute('disabled', ''); // Disable the button until the image is analyzed
    playButton.class('grayed-out');

    // Create pause button
    pauseButton = createButton('');
    pauseButton.position(buttonX, firstButton + 120);
    pauseButton.mousePressed(handlePause);
    pauseButton.elt.innerHTML = '<i class="fas fa-pause"></i>'; // Place icon inside the button
    pauseButton.style('width', '80px');
    pauseButton.attribute('disabled', ''); // Disable the button until the image is analyzed
    pauseButton.class('grayed-out');

    // Create reset button
    resetButton = createButton('');
    resetButton.position(buttonX, firstButton + 180);
    resetButton.mousePressed(handleReset);
    resetButton.elt.innerHTML = '<i class="fas fa-undo"></i>'; // Place icon inside the button
    resetButton.style('width', '80px');
    resetButton.attribute('disabled', ''); // Disable the button until the image is analyzed
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
    dimInput.elt.addEventListener('input', updateLabelPosition);

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


    // --- FRAME RATE SLIDER ---
    const frameRateX = 740;
    const frameRateY = 460;
    frameRateSlider = createSlider(1, 60, 30);
    frameRateSlider.position(frameRateX, frameRateY);
    frameRateSlider.style('width', '200px');
    frameRateSlider.input(() => {
        frameRate(frameRateSlider.value());
    });
    // put text next to the slider
    const frameRateText = createP('Generation Speed');
    frameRateText.position(frameRateX + 50, frameRateY - 40);


    // --- DOWNLOAD BUTTONS ---

    const downloadX = 1100;
    const downloadY = 480;

    // Create a download image button
    saveImageButton = createButton('Download Image <br>');
    saveImageButton.elt.innerHTML += '<i class="fas fa-download"></i>'; // Place icon inside the button
    saveImageButton.position(downloadX, downloadY);
    saveImageButton.style('width', '100px');
    saveImageButton.style('font-size', '12px');
    saveImageButton.mousePressed(handleImageDownload);

    // Create a download tilemap json button
    saveTilemapButton = createButton('Download Tilemap <br>');
    saveTilemapButton.elt.innerHTML += '<i class="fas fa-download"></i>'; // Place icon inside the button
    saveTilemapButton.position(downloadX + 130, downloadY);
    saveTilemapButton.style('width', '100px');
    saveTilemapButton.style('font-size', '12px');
    saveTilemapButton.mousePressed(handleTilemapDownload);

    // create a button to download the tile mappings
    saveRulesButton = createButton('Download Tile Rules <br>');
    saveRulesButton.elt.innerHTML += '<i class="fas fa-download"></i>'; // Place icon inside the button
    saveRulesButton.position(downloadX + 260, downloadY);
    saveRulesButton.style('width', '100px');
    saveRulesButton.style('font-size', '12px');
    saveRulesButton.mousePressed(handleRulesDownload);
    enableDownloadButtons(false);



    // Create GitHub link to the repo
    githubLink = createA('https://github.com/NathanHinthorne/Wave-Function-Collapse?tab=readme-ov-file', 'GitHub Repository ');
    githubLink.position(10, 655);
    githubLink.class('github-link');
    githubLink.elt.innerHTML += '<i class="fab fa-github"></i>'; // Place icon inside the button
    githubLink.style('width', '145px');

    // Create a collapsable help menu
    // displayHelpMenu(700, 10, 400, 400);

    // Create a simple how to use section
    displayGettingStarted(670, 50, 340, 410);


    // --- LOGS ---
    // Create a button to download the logs
    // const downloadLogsButton = createButton('Download Logs');
    // downloadLogsButton.class('yellow-button')
    // downloadLogsButton.position(800, 630);
    // downloadLogsButton.mousePressed(downloadLogs);
}


function analyze() {
    analyzeTiles();
    imageIsAnalyzed = true;
    enableEditButtons(true);
}

function handlePlay() {
    if (outputIsComplete || outputGrid.length == 0) { // if grid output grid is empty or completely filled
        initializeOutputGrid();
        outputIsComplete = false;
        enableDownloadButtons(false);
    }

    // simply resume the output generation
    outputIsGenerating = true;
}

function handlePause() {
    outputIsGenerating = false;
}

function handleReset() {
    initializeOutputGrid();
    outputIsGenerating = false;
    outputIsComplete = false;
    enableDownloadButtons(false);
}

function updateDim() {
    if (!isNaN(dimInput.value()) && imageIsAnalyzed) {
        if (dimInput.value() >= 1 && dimInput.value() <= 100) {
            dim = parseInt(dimInput.value());

            handleReset();

            const error = select('#dim-error');
            if (error) {
                error.remove();
            }
        } else {
            let errorText = createP('Dimensions must be between 1 and 100.');
            errorText.class('error-message');
            const error = select('#dim-error');
            if (error) {
                error.remove();
            }
            errorText.id('dim-error');
        }
    }
}

function updateTileSize() {

    if (!isNaN(tileSizeInput.value())) {
        if (tileSizeInput.value() >= 10 && tileSizeInput.value() <= 100) {
            tilePixelSize = parseFloat(tileSizeInput.value());

            parseImage();
            imageIsAnalyzed = false;
            outputIsInitialized = false;
            enableEditButtons(false);
            redraw();

            const error = select('#tile-size-error');
            if (error) {
                error.remove();
            }
        } else {
            let errorText = createP('Tile size must be between 10 and 100 pixels.');
            errorText.class('error-message');
            const error = select('#tile-size-error');
            if (error) {
                error.remove();
            }
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

function updateLabelPosition(event) {
    const inputField = event.target;

    console.log('Placeholder text:', inputField.placeholder);

    if (inputField.value) {
        inputField.classList.add('has-content');
    } else {
        inputField.classList.remove('has-content');
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
    outputIsInitialized = false;
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
    const width = outputGrid[0].length * tilePixelSize;
    const height = outputGrid.length * tilePixelSize;
    let outputImage = createGraphics(width, height);

    for (let y = 0; y < outputGrid.length; y++) {
        for (let x = 0; x < outputGrid[y].length; x++) {
            let cell = outputGrid[y][x];
            const index = cell.selectedTile;
            outputImage.image(tileVariants[index].img, x * tilePixelSize, y * tilePixelSize, tilePixelSize, tilePixelSize);
        }
    }

    outputImage.save('output.png');
}

function handleTilemapDownload() {
    let tilemap = [];

    for (let y = 0; y < outputGrid.length; y++) {
        tilemap[y] = [];
        for (let x = 0; x < outputGrid[y].length; x++) {
            const cell = outputGrid[y][x];
            const tileIndex = cell.selectedTile;
            tilemap[y][x] = tileIndex;
        }
    }

    // Manually construct JSON string
    let jsonStr = "{\n\t\"tilemap\": [\n";
    tilemap.forEach((row, rowIndex) => {
        jsonStr += "\t\t[";
        row.forEach((tile, tileIndex) => {
            jsonStr += tile;
            if (tileIndex !== row.length - 1) {
                jsonStr += ", ";
            }
        });
        jsonStr += (rowIndex !== tilemap.length - 1) ? "],\n" : "]\n";
    });
    jsonStr += "\t]\n}";

    downloadJSON(jsonStr, 'tilemap.json');
}

function handleRulesDownload() {
    // make json for the adjacency rules and frequency hints of the tiles

    let rules = [];
    for (let i = 0; i < tileVariants.length; i++) {
        let tile = tileVariants[i];
        let rule = {
            "tile": i,
            "up neighbors": Array.from(tile.up.entries()),
            "right neighbors": Array.from(tile.right.entries()),
            "down neighbors": Array.from(tile.down.entries()),
            "left neighbors": Array.from(tile.left.entries()),
        };
        rules.push(rule);
    }

    let rulesJSON = {
        "rules": rules
    };

    // Manually construct JSON string
    let jsonStr = "{\n\t\"rules\": [\n";
    rules.forEach((rule, index) => {
        jsonStr += "\t\t{\n";
        jsonStr += `\t\t\t"tile": ${rule.tile},\n`;
        jsonStr += `\t\t\t"up neighbors": ${JSON.stringify(rule["up neighbors"])},\n`;
        jsonStr += `\t\t\t"right neighbors": ${JSON.stringify(rule["right neighbors"])},\n`;
        jsonStr += `\t\t\t"down neighbors": ${JSON.stringify(rule["down neighbors"])},\n`;
        jsonStr += `\t\t\t"left neighbors": ${JSON.stringify(rule["left neighbors"])}\n`;
        jsonStr += (index !== rules.length - 1) ? "\t\t},\n" : "\t\t}\n";
    });
    jsonStr += "\t]\n}";

    downloadJSON(jsonStr, 'tile-rules.json');
}

function downloadJSON(json, filename) {
    let blob = new Blob([json], { type: "application/json" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement('a');
    a.download = filename;
    a.href = url;
    a.click();
}

function enableEditButtons(isEnabled) {
    if (isEnabled) {
        playButton.removeAttribute('disabled');
        resetButton.removeAttribute('disabled');
        pauseButton.removeAttribute('disabled');
        playButton.removeClass('grayed-out');
        pauseButton.removeClass('grayed-out');
        resetButton.removeClass('grayed-out');
    } else {
        playButton.attribute('disabled', '');
        resetButton.attribute('disabled', '');
        pauseButton.attribute('disabled', '');
        playButton.class('grayed-out');
        pauseButton.class('grayed-out');
        resetButton.class('grayed-out');
    }
}

function enableDownloadButtons(isEnabled) {
    if (isEnabled) {
        saveImageButton.removeAttribute('disabled');
        saveTilemapButton.removeAttribute('disabled');
        saveImageButton.removeClass('grayed-out');
        saveTilemapButton.removeClass('grayed-out');
        saveRulesButton.removeAttribute('disabled');
        saveRulesButton.removeClass('grayed-out');
    } else {
        saveImageButton.attribute('disabled', '');
        saveTilemapButton.attribute('disabled', '');
        saveImageButton.class('grayed-out');
        saveTilemapButton.class('grayed-out');
        saveRulesButton.attribute('disabled', '');
        saveRulesButton.class('grayed-out');
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

        push(); // Save current drawing style settings and transformations

        // Draw the tile index below the tile image
        fill(0);
        textSize(8);
        const str = i.toString();
        const txtWidth = textWidth(str);
        text(str, tileXPos + tileDisplaySize / 2 - txtWidth / 2, tileYPos + tileDisplaySize + 10);

        // Draw black lines around the tile
        stroke(0);
        strokeWeight(1);
        noFill();
        rect(tileXPos, tileYPos, tileDisplaySize, tileDisplaySize);

        pop(); // Restore saved drawing style settings and transformations
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

    push();

    // Draw a light gray background behind the input grid
    fill(230);
    noStroke();
    rect(cardX, cardY, cardWidth, cardHeight, 2);

    if (dim <= 40) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let cell = outputGrid[y][x];
                const xPos = cardX + x * (tileDisplaySize + spacing) + margin;
                const yPos = cardY + y * (tileDisplaySize + spacing) + margin;

                // Draw black lines around the tile
                stroke(0);
                strokeWeight(1);
                noFill();
                rect(xPos, yPos, tileDisplaySize, tileDisplaySize);

                if (cell.collapsed) {
                    // draw the tile image
                    let index = cell.selectedTile;
                    image(tileVariants[index].img, xPos, yPos, tileDisplaySize, tileDisplaySize);
                } else {
                    let roughEntropy = cell.options.size;
                    let maxEntropy = cell.maxEntropy;
                    let greenShade = map(roughEntropy, 0, maxEntropy, 0, 255);

                    // Draw a rectangle with a shade of green based on the entropy value
                    fill(greenShade, 255, greenShade);
                    if (roughEntropy === 0) {
                        fill(255, 0, 0);
                    }
                    rect(xPos, yPos, tileDisplaySize, tileDisplaySize);

                    if (dim <= 20) {
                        // Draw the entropy value in the center of the cell
                        fill(0);
                        textSize(10);
                        strokeWeight(0);
                        textAlign(CENTER, CENTER);
                        text(roughEntropy, xPos + tileDisplaySize / 2, yPos + tileDisplaySize / 2);
                    }
                }
            }
        }
    } else {
        // if the grid is too large, simply display the progress

        const completionPercentage = Math.floor(completionProgress * 100);

        fill(0);
        textSize(20);
        textAlign(CENTER, CENTER);
        text(completionPercentage + '%', cardX + cardWidth / 2, cardY + cardHeight / 2);

        // Draw a progress bar
        fill(0);
        rect(cardX + 10, cardY + cardHeight / 2 + 20, cardWidth - 20, 20);
        fill(0, 255, 0);
        rect(cardX + 10, cardY + cardHeight / 2 + 20, completionProgress * (cardWidth - 20), 20);
    }

    pop();
}

function playBeepSFX(freq, duration) {
    console.log('Playing beep at frequency: ' + freq);
    oscillator.freq(freq);
    oscillator.start();
    envelope.play(oscillator, 0, duration);
}

function displayGettingStarted(cardX, cardY, cardWidth, cardHeight) {
    // Create a card for the getting started section
    const card = createDiv('');
    card.position(cardX, cardY);
    card.size(cardWidth, cardHeight);
    card.id('getting-started');

    // Create a title for the card
    const title = createP('How to Use');
    title.style('font-size', '24px');
    title.style('font-weight', 'bold');
    title.parent(card);

    // Create a paragraph for the card
    const helpText = createP(
        '1. Upload an image composed of tiles (similar to the example below). <br><br>' +
        '2. Set the tile size. <br><br>' +
        '3. Click "Analyze" to identify tile variants and the patterns between them. <br><br>' +
        '4. Set the dimensions of the output grid. <br><br>' +
        '5. Click "Play" to generate the tilemap. <br><br>' +
        '6. Click "Download Image" to save the output image or "Download Tilemap" to save the tilemap as a JSON file.');
    helpText.parent(card);
}

// function mouseClicked() {

//     // Calculate the cell under the mouse
//     const x = Math.floor((mouseX - OUTPUT_IMAGE_DISPLAY_SIZE) / tilePixelSize);
//     const y = Math.floor((mouseY - OUTPUT_IMAGE_DISPLAY_SIZE) / tilePixelSize);

//     console.log('Mouse clicked at: ' + x + ', ' + y);

//     const gridWidth = outputGrid[0].length;
//     const gridHeight = outputGrid.length;

//     // Check if the cell is within the grid and not collapsed
//     if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
//         const cell = outputGrid[y][x];
//         if (!cell.collapsed) {
//             // Show the popup for this cell
//             drawPopup(mouseX, mouseY, cell);
//             return;
//         }
//     }

//     // Hide the popup if it's not over a valid cell
//     if (popupDiv) {
//         popupDiv.remove();
//         popupDiv = null;
//     }
// }


// function drawPopup(x, y, cell) {
//     // Create a div for the popup
//     if (popupDiv) {
//         popupDiv.remove();
//     }
//     popupDiv = createDiv('');
//     popupDiv.position(x, y);
//     popupDiv.id('tile-popup');
//     popupDiv.mouseOut(() => {
//         popupDiv.remove();
//         popupDiv = null;
//     });

//     // Draw the tile images for the cell's options
//     for (let i = 0; i < cell.options.length; i++) {
//         const tileIndex = cell.options[i];
//         const tileImage = tileVariants[tileIndex].img;
//         const imgElem = createImg(tileImage.src);
//         imgElem.parent(popupDiv);
//     }
// }



/*
====================================================================
Functions to aid in algorithm analysis
====================================================================
*/
function downloadLogs() {
    // Create a Blob with the logs
    // const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const blob = new Blob([logs.join('\n')], { type: 'text/csv' });

    // Create a link element
    const link = document.createElement('a');

    // Set the href to the Blob URL
    link.href = URL.createObjectURL(blob);

    // Set the download attribute to the desired file name
    const fileName = 'WFC logs ' + new Date().toLocaleString() + '.csv';
    link.download = fileName;

    // Add the link to the document
    document.body.appendChild(link);

    // Simulate a click on the link
    link.click();

    // Remove the link from the document
    document.body.removeChild(link);
}

