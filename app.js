const tetronimos = {
    'T': [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1]
    ],
    'L': [
        [0, 0],
        [0, 1],
        [0, -1],
        [1, 1]
    ],
    'skew': [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, -1]
    ],
    'box': [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
    ],
    'line': [
        [0, 0],
        [-1, 0],
        [1, 0],
        [2, 0],
    ]
}
const halls = [];

var currentHall = 0;
var currentlyHovered = [];

class Truck {
    status = 'operational';
    content = [];
    conveyor = null;
    destination = "'s-Hertogenbosch";
    weather = null

    constructor(width, len, type, distance) {
        this.width = width;
        this.len = len;
        this.type = type;
        this.distance = distance;

        // Create a new truck dom element
        const truck = document.createElement('div');
        truck.className = 'truck';
        truck.innerHTML = `
            <div class="truck-wheels"></div>
            <div class="truck-trailer"></div>
            <div class="truck-front">
                <button class="depart-truck">Vertrek</button>
            </div>
        `;

        // Add properties to dom
        truck.setAttribute('type', type);
        truck.setAttribute('distance', distance);

        // Save truck dom element
        this.truckElement = truck;

        // Add depart button to truck
        truck.querySelector('.depart-truck').addEventListener('click', () => this.conveyor.departTruck(this));

        this.updateStatus();
        this.updateStatusInterval();
    }

    openModal(boxes) {
        // Check if document already contains a modal
        if (document.getElementById('modal')) return;

        // Create modal with a list of boxes
        const modal = document.createElement('div');
        modal.id = 'modal';
        modal.className = 'modal';
        modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <button id="close">Sluiten</button>
                        </div>
                        <div class="modal-body">
                            <div class="grid"></div>
                            <p>Transporttype: ${this.type}</p>
                            <p>Actieradius: ${this.distance}</p>
                            <p>Status: ${this.status}</p>
                            <p>Bestemming:</p>
                            <ul>
                                <li>${this.destination}</li>
                                <li>Temp: ${this.weather.current.temp_c} celcius</li>
                                <li>Conditie: ${this.weather.current.condition.text}</li>
                            </ul>
                        </div>
                        <div class="modal-footer">
                            <h3>Dozen op de band</h3>
                            <div class="list"></div>
                        </div>
                    </div>
                `;

        // Close modal on button click
        modal.querySelector('#close').addEventListener('click', () => { modal.remove() });

        // Make a grid
        const grid = modal.querySelector('.grid');
        makeGrid(this, grid, this.width, this.len);

        // Set all taken coordinates to filled
        for (let i = 0; i < this.content.length; i++) {
            const x = this.content[i].x;
            const y = this.content[i].y;

            // Check shape coordinates
            tetronimos[this.content[i].box.type].forEach(coordinate => {
                // Get slot element
                const slot = grid.querySelector(`[x="${x + coordinate[0]}"][y="${y + coordinate[1]}"]`);

                // Set slot background
                slot.style.backgroundColor = this.content[i].box.color;

                // Add box id as property
                slot.setAttribute('box', this.content[i].box.id);
            })

            // TODO: Check shapes
        }

        // Add all boxes add boxElement to the modal list
        const list = modal.querySelector('.list');
        boxes.forEach(box => {
            const boxElement = box.clone()
            list.appendChild(boxElement);

            // Allow for boxes to be dragged to specific position in the modal grid
            boxElement.draggable = true;

            // Add id to data transfer
            boxElement.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', boxElement.id);

                // Add id to localstorage
                localStorage.setItem('box', boxElement.id);
            });

            boxElement.addEventListener('dragend', (e) => {
                // Remove box from local storage if it exists
                if (localStorage.getItem('box'))
                    localStorage.removeItem('box');
            });
        });

        // Add modal to document
        document.body.appendChild(modal);
    }

    // Update status
    updateStatus() {
        // Get weather info
        getWeather(this.destination)
            .then((weather) => {
                this.weather = weather;

                // Snow codes
                const snowCodes = [
                    1066,
                    1072,
                    1114,
                    1117,
                    1219,
                    1222,
                    1225,
                    1237
                ];

                const rainCodes = [
                    1183,
                    1186,
                    1189,
                    1192,
                    1195,
                    1198,
                    1246
                ];

                // If weather is rainy or snowing and the truck is of type 'fragile' set status to 'stopped'
                if (snowCodes.includes(weather.current.condition.code) || rainCodes.includes(weather.current.condition.code)) {
                    if (this.type === 'fragile') this.status = 'stopped';
                    // Set button in truckElement to disabled
                    this.truckElement.querySelector('.depart-truck').disabled = true;
                } else {
                    if (this.type === 'cold') this.status = 'operational';
                    // Set button in truckElement to enabled
                    this.truckElement.querySelector('.depart-truck').disabled = false;
                }

                // If weather is above 35 degrees celcius and the truck is of type 'cold' set status to 'stopped'
                if (weather.temp_c > 35) {
                    if (this.type === 'cold') this.status = 'stopped';
                    // Set button in truckElement to disabled
                    this.truckElement.querySelector('.depart-truck').disabled = true;
                } else {
                    if (this.type === 'cold') this.status = 'operational';
                    // Set button in truckElement to enabled
                    this.truckElement.querySelector('.depart-truck').disabled = false;
                }
            });
    }

    // Update status every 5 seconds
    updateStatusInterval() {
        setInterval(() => {
            this.updateStatus();
        }, 5000);
    }
}

class Box {
    id = 'box-' + Math.random().toString(36).substring(7);
    boxElement = null;
    progress = 0;
    color = "#000000".replace(/0/g, () => (~~(Math.random() * 16)).toString(16));
    type = Object.keys(tetronimos)[Math.floor(Math.random() * Object.keys(tetronimos).length)];

    constructor() {
        // Create a box element
        const box = document.createElement('div');
        box.className = 'box';

        // Set box attributes
        box.setAttribute('conveyor', true);
        box.setAttribute('title', this.type + ' doos');
        box.style.background = this.color;

        // Add box to document
        document.body.appendChild(box);

        // Save box element
        this.boxElement = box;
    }

    // Generate a copy of the box element
    clone() {
        const box = this.boxElement.cloneNode(true);
        box.className = 'box';

        // Remove all styling
        box.style = '';
        box.style.background = this.color;

        // Add box id
        box.id = this.id;

        // Remove all attributes
        box.removeAttribute('conveyor');

        return box;
    }
}

class Conveyor {
    boxes = [];
    truck = null;
    speed = 1;

    constructor() {
        // Create a new column dom element
        const column = document.createElement('div');
        column.className = 'column';

        // Add a conveyor and empty space to column
        column.innerHTML = `
            <div class="conveyor"></div>
            <div class="truck-position"></div>
        `;

        // Add column to document
        document.body.appendChild(column);

        // Save column dom element
        this.columnElement = column;

        // Start the conveyor
        this.start();
    }

    setTruck(truck) {
        this.truck = truck;

        // Show truck modal when truckElement trailer is clicked
        this.truck.truckElement.querySelector('.truck-trailer').addEventListener('click', () => {
            this.truck.openModal(this.boxes);
        });

        // Add truck to the truck position
        const truckPosition = this.columnElement.querySelector('.truck-position');
        truckPosition.appendChild(truck.truckElement);

        // Set truck conveyor
        truck.conveyor = this;
    }

    departTruck() {
        // Remove truck from truck position
        const truckPosition = this.columnElement.querySelector('.truck-position');
        truckPosition.innerHTML = '';

        this.truck.status = 'departed';

        this.truck.conveyor = null;
        this.truck = null;

    }

    addBox(box) {
        this.boxes.push(box);

        // Add box to conveyor
        const conveyor = this.columnElement.querySelector('.conveyor');
        conveyor.appendChild(box.boxElement);
    }

    removeBox(box) {
        // Remove box from conveyor boxes and queue
        this.boxes = this.boxes.filter(b => b.id !== box.id);

        // Remove box from conveyor
        const conveyor = this.columnElement.querySelector('.conveyor');
        conveyor.removeChild(box.boxElement);
    }

    moveBoxes() {
        // Move all boxes down the conveyor
        this.boxes.forEach(box => {

            // Get total height of conveyor
            const conveyorHeight = this.columnElement.querySelector('.conveyor').clientHeight;

            // Get index of current box
            const index = this.boxes.indexOf(box);

            // Calculate endpoint
            const endpoint = (conveyorHeight - (index * box.boxElement.clientHeight)) - box.boxElement.clientHeight;

            // Check if box has reached the bottom of the conveyor
            if (box.progress >= endpoint)
                return;

            // Move box down using transform
            box.boxElement.style.transform = `translateY(${box.progress++}px)`;
        });
    }

    // Create a loop to move all boxes down the conveyor
    start() {
        setInterval(() => {
            this.moveBoxes();
        }, this.speed);
    }
}

class Hall {
    columns = [];
    id = 0;

    constructor(id) {
        this.id = id;

        // Create a new hall dom element
        const hall = document.createElement('div');
        hall.className = 'hall';

        // Add a title to the hall
        hall.innerHTML = `
            <h1>Hall ${id}</h1>
        `;

        // Add hall to document
        document.body.appendChild(hall);

        // Save hall dom element
        this.hallElement = hall;
    }

    addColumn(column) {
        this.columns.push(column);

        // Add columnElement to hallElement
        this.hallElement.appendChild(column.columnElement);
    }

    addTruck(truck) {
        // Add truck to first available column
        const firstAvailableColumn = this.columns.find(column => column.truck === null);

        // If there is no available column, abort
        if (!firstAvailableColumn) return;
        firstAvailableColumn.setTruck(truck);

        // Log which column the truck is in
        console.log(`Truck has been added to column ${this.columns.indexOf(firstAvailableColumn)}`);
    }
}

function initialiseHalls() {
    // Create two halls
    const hall1 = new Hall(0);
    const hall2 = new Hall(1);

    // Add 3 columns to each hall
    for (let i = 0; i < 3; i++) {
        hall1.addColumn(new Conveyor());
        hall2.addColumn(new Conveyor());
    }

    // Add halls to halls array
    halls.push(hall1);
    halls.push(hall2);

    // Get wrapper and put halls inside
    const wrapper = document.querySelector('#wrapper');
    wrapper.appendChild(hall1.hallElement);
    wrapper.appendChild(hall2.hallElement);

    // Set opacity of second hall element to 0 and set width to 0
    hall2.hallElement.style.opacity = 0;
    hall2.hallElement.style.width = 0;
}

// On button click, add a new conveyor to the current hall
document.getElementById('add-conveyor').addEventListener('click', () => {
    // Add a new conveyor to the current hall
    halls[currentHall].addColumn(new Conveyor());
});

// On button click, add a new box to a random conveyor from the current hall
document.getElementById('add-box').addEventListener('click', () => {
    // Pick a random column from the current hall
    const randomColumn = halls[currentHall].columns[Math.floor(Math.random() * halls[currentHall].columns.length)];
    randomColumn.addBox(new Box());

    // Log which column the box is in
    console.log(`Box has been added to column ${halls[currentHall].columns.indexOf(randomColumn)}`);
});

// On truck submit, create a new truck
document.getElementById('truck-form').addEventListener('submit', e => {
    e.preventDefault();

    // Get truck values
    const width = document.getElementById('width').value;
    const len = document.getElementById('length').value;

    // Get truck type from select
    const type = document.getElementById('type').value;

    // Get truck distance from radio buttons
    const distance = document.querySelector('input[name="distance"]:checked').value;

    // Create a new truck
    const truck = new Truck(width, len, type, distance);

    // Add truck to current hall
    halls[currentHall].addTruck(truck);
});

initialiseHalls();

// Get weather from API with fetch for named location
const getWeather = async (location) => {
    const apiKey = 'c1fe0dfeb01b492cbdc193725223003';
    const response = await fetch(`http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}&aqi=no`);
    return response.json();
}

// Switch active hall
document.getElementById('hall-switch').addEventListener('click', e => {
    // Get hall index from hall-select
    const hallIndex = currentHall == 0 ? 1 : 0;

    // Set current hall to hallIndex
    currentHall = hallIndex;

    // Get hall element from halls array
    const hallElement = halls[currentHall].hallElement;

    // Hide other hall
    halls.forEach(hall => {
        if (hall.hallElement != hallElement) {
            // Set opacity to 0 and set width to 0
            hall.hallElement.style.opacity = 0;
            hall.hallElement.style.width = 0;
        }
    });

    // Set opacity to 1 and unset width
    hallElement.style.opacity = 1;
    hallElement.style.width = '';
});

// Make a grid of divs in specified parent
const makeGrid = (truck, parent, rows, columns) => {
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        parent.appendChild(row);

        const resetSlotVisuals = (slot) => {
            if (!currentlyHovered.includes(slot) && !slot.hasAttribute('box')) {
                slot.style.backgroundColor = '';
            }
        };

        for (let j = 0; j < columns; j++) {
            const column = document.createElement('div');
            column.className = 'slot';

            // Add x and y attributes to column
            column.setAttribute('x', i);
            column.setAttribute('y', j);

            // Make column droppable
            column.addEventListener('dragover', e => {
                e.preventDefault();
            });

            column.addEventListener('dragleave', e => {
                // Reset background of all slots
                parent.querySelectorAll('.slot').forEach(slot => resetSlotVisuals(slot));
            });

            column.addEventListener('dragenter', e => {
                currentlyHovered = [];

                // Get x and y attributes from column
                const x = parseInt(column.getAttribute('x'));
                const y = parseInt(column.getAttribute('y'));

                // Get id from localstorage
                const id = localStorage.getItem('box');

                // Log where box is dragged
                console.log(`Box ${id} has been dragged in slot ${x}, ${y}`);

                // Get box from truck conveyor
                const boxFromTruckConveyor = truck.conveyor.boxes.find(box1 => box1.id == id);

                console.log(boxFromTruckConveyor);

                // Check if placement is valid
                const backgroundColor = checkPlacement(parent, boxFromTruckConveyor, x, y) ? hexToRgba(boxFromTruckConveyor.color, 0.5) : hexToRgba('#ff0000', 0.5)

                // Check shape coordinates
                tetronimos[boxFromTruckConveyor.type].forEach(coordinate => {
                    // Get slot element
                    const slot = parent.querySelector(`[x="${x + coordinate[0]}"][y="${y + coordinate[1]}"]`);

                    if (slot != null && !slot.hasAttribute('box')) {
                        // Set background color of slot to box color but with 50% opacity
                        slot.style.backgroundColor = backgroundColor;
                        currentlyHovered.push(slot);
                    }
                });

            });

            // Add drop listener
            column.addEventListener('drop', e => {
                currentlyHovered = [];

                parent.querySelectorAll('.slot').forEach(slot => resetSlotVisuals(slot));

                // Remove box from local storage if it exists
                if (localStorage.getItem('box'))
                    localStorage.removeItem('box');

                // Get x and y attributes from column
                const x = parseInt(column.getAttribute('x'));
                const y = parseInt(column.getAttribute('y'));

                // Get id from data
                const id = e.dataTransfer.getData('text');

                // Get dom box with id
                const box = document.getElementById(id);

                // Get box from truck conveyor
                const boxFromTruckConveyor = truck.conveyor.boxes.find(box1 => box1.id == id);

                // Cancel if box is not found
                if (!boxFromTruckConveyor) return;

                // Cancel if placement is invalid
                if (!checkPlacement(parent, boxFromTruckConveyor, x, y)) return;

                // Log where box is dropped
                console.log(`Box ${id} has been dropped in slot ${x}, ${y}`);

                // Check shape coordinates
                tetronimos[boxFromTruckConveyor.type].forEach(coordinate => {
                    // Get slot element
                    const slot = parent.querySelector(`[x="${x + coordinate[0]}"][y="${y + coordinate[1]}"]`);

                    // Set background color of slot to box color
                    slot.style.backgroundColor = boxFromTruckConveyor.color;

                    // Add box attribute to slot
                    slot.setAttribute('box', id);
                })

                // Delete box element
                box.remove();

                // Remove box from truck conveyor
                truck.conveyor.removeBox(boxFromTruckConveyor);

                // Create a new object to store box with grid coordinates
                const boxObject = {
                    x: x,
                    y: y,
                    box: boxFromTruckConveyor
                };

                // Add box to truck content
                truck.content.push(boxObject);
            });

            // Add column to row
            row.appendChild(column);
        }
    }
}

// Convert a hex color to rgba
function hexToRgba(hex, opacity) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})`;
}

// Check if box placement is valid
function checkPlacement(parent, box, x, y) {
    var flag = true;

    // Check shape coordinates
    tetronimos[box.type].forEach(coordinate => {
        // Get slot element
        const slot = parent.querySelector(`[x="${x + coordinate[0]}"][y="${y + coordinate[1]}"]`);

        if (slot == null || slot.hasAttribute('box'))
            flag = false;

        if (!flag) return;
    });

    return flag;
}

// Display active page in truck form
function displayPage(page) {
    const truckForm = document.getElementById('truck-form');
    truckForm.setAttribute('page', page);
    truckForm.querySelectorAll('.page').forEach(el => el.style.display = 'none');
    truckForm.querySelector(`.page[order="${page}"]`).style.display = 'flex';
}

document.getElementById('next-page').addEventListener('click', () => {
    const truckForm = document.getElementById('truck-form');
    const page = truckForm.hasAttribute('page') ? parseInt(truckForm.getAttribute('page')) + 1 : 1;
    const count = truckForm.querySelectorAll('.page').length;
    displayPage(page > count ? 1 : page);
});

displayPage(1)