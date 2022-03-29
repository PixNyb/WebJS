const conveyorTemplate =
    `<svg class="conveyor" width="100" height="700" viewBox="0 0 100 700" fill="none"
    xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="700" fill="white" />
        <rect width="100" height="700" fill="#FFA4A4" />
        <path class="conveyor-path" d="M50 0V700" stroke="black" />
    </svg>`,
    truckLengths = ["short", "middle", "long"],
    truckWidths = ["narrow", "middle", "wide"],
    audio = new Audio('https://upload.wikimedia.org/wikipedia/commons/e/e5/Tetris_theme.ogg');

var conveyors = [];
var trucks = []
let lastBoxId = 0;
class Box {
    constructor(displayElement) {
        this.displayElement = displayElement
        this.position = 0.0;
        this.speed = 0.3;
        this.deltaTime = 1000;

        const movementInterval = setInterval(() => {
            this.position += this.speed / this.deltaTime;

            if (this.position >= 1) clearInterval(movementInterval);
        }, 1000 / this.deltaTime);

        this.id = lastBoxId++;
    }
}

class Conveyor {
    #loop = null;

    constructor(svg) {
        this.boxes = [];
        this.truck = null;
        this.svg = svg;
        this.refreshRate = 1000;
        this.pathElement = svg.getElementsByClassName('conveyor-path')[0];
        this.start();
    }

    get path() {
        return this.pathElement;
    }

    get pathLength() {
        return this.pathElement.getTotalLength();
    }

    getPointAtLength(x) {
        return this.pathElement.getPointAtLength(x);
    }

    setTruck(truck) {
        this.truck = truck;
        this.svg.parentElement.appendChild(this.truck.truckImage)
    }

    removeTruck() {
        this.truck = null;
    }

    addBox(box) {
        this.svg.parentElement.appendChild(box.displayElement);
        return this.boxes.push(box);
    }

    start() {
        this.#loop = setInterval(() => {
            this.#updateConveyor(this)
        }, this.refreshRate);
    }

    pause() {
        clearInterval(this.#loop);
    }

    #updateConveyor(conveyor) {
        for (const box of conveyor.boxes) {
            let p = conveyor.getPointAtLength(box.position * conveyor.pathLength);
            box.displayElement.style.top = `${p.y}px`;
            // box.displayElement.style.left = `${p.x}px`;

            if (box.position == 1) {
                conveyor.boxes.remove(box);
            }
        }
    }
}

class Truck {

    constructor(length, width, type, distance) {
        this.len = length;
        this.width = width;
        this.type = type;
        this.distance = distance;
        this.trailerLoad = new Array(length).fill(0);
        for (let i = 0; i < length; i++) {
            this.trailerLoad[i] = new Array(width).fill(0);
        }
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < width; j++) {
                this.trailerLoad[i][j] = null;
            }
        }
    }

    get truckImage() {
        let elem = document.createElement('div');
        elem.classList.add('truck-image');
        elem.setAttribute('distance', this.distance)
        elem.setAttribute('type', this.type)
        elem.innerHTML = `
            <div class="front"></div>
            <div class="trailer" data-truck="0"></div>
            <div class="body"></div>
            <div class="wheel" style="bottom: 0; left: 15%"></div>
            <div class="wheel" style="bottom: 0; left: 75%"></div>
            <div class="wheel" style="bottom: 0; left: 90%"></div>`;

        const trailer = elem.getElementsByClassName('trailer')[0];
        trailer.style.gridTemplateRows = `repeat(${this.len}, 1fr)`;
        trailer.style.gridTemplateRows = `repeat(${this.width}, 1fr)`;
        for (let x = 0; x < this.len; x++) {
            for (let j = 0; j < this.width; j++) {
                let div = document.createElement('div');
                div.classList.add('dropzone');
                div.style.gridColumn = (x + 1) + ' / span 1';
                div.style.gridRow = (j + 1) + ' / span 1';
                div.addEventListener('drop', drop);
                div.addEventListener('dragover', allowDrop);
                div.setAttribute('data-x', x);
                div.setAttribute('data-y', j);
                trailer.appendChild(div);
            }
        }

        let i = 0;
        if (this.len > 5) i++;
        if (this.len > 10) i++;
        elem.setAttribute('length', truckLengths[i]);

        i = 0;
        if (this.width > 3) i++;
        if (this.width > 6) i++;
        elem.setAttribute('width', truckWidths[i]);

        return elem;
    }
}

initialiseTruckVisualisation();

function initialiseTruckVisualisation() {
    const truck = document.querySelector('#truck > .preview > .truck-image');
    const form = document.getElementById('truck-form');
    const length = document.getElementById('truck-length');
    const width = document.getElementById('truck-width');

    length.addEventListener('input', (e) => {
        let i = 0;
        if (length.value > 5) i++;
        if (length.value > 10) i++;
        truck.setAttribute('length', truckLengths[i]);
    });

    width.addEventListener('input', (e) => {
        let i = 0;
        if (width.value > 3) i++;
        if (width.value > 6) i++;
        truck.setAttribute('width', truckWidths[i]);
    });

    form.querySelectorAll('input[name="distance"]').forEach(el => {
        el.addEventListener('change', (e) => {
            let distance = document.querySelector('input[name="distance"]:checked');
            truck.setAttribute('distance', distance.value);
        })
    })
}


function addBox() {

    // Create a div with class box
    const boxDisplay = document.createElement('div'),
        box = new Box(boxDisplay);

    boxDisplay.classList.add('box');
    boxDisplay.classList.add('transformable');
    boxDisplay.setAttribute('id', `box-${box.id}`);
    boxDisplay.setAttribute('draggable', 'true');
    boxDisplay.addEventListener('dragstart', drag)
    conveyors.forEach(e => e.addBox(box));
}

function addConveyor() {
    const wrapper = document.getElementsByClassName('wrapper')[0],
        column = document.createElement('div');

    column.classList.add('column');
    column.innerHTML = conveyorTemplate;

    wrapper.appendChild(column);

    const conveyor = new Conveyor(column.getElementsByClassName('conveyor')[0]);

    conveyors.push(conveyor);
}

function showConveyors(){
    for (let i = 0; i < halls[currentHall].conveyors.length; i++) {
        const conveyor = halls[currentHall].conveyors[i];
        const wrapper = document.getElementsByClassName('wrapper')[0],
            column = document.createElement('div');

        column.classList.add('column');
        column.innerHTML = conveyorTemplate;

        console.log(conveyor);

        wrapper.appendChild(column);

        if (conveyor.truck != null){
            wrapper.appendChild(conveyor.truck.truckImage)
        }
    }
}

function addTruck(truck) {
    conveyors.forEach(e => {
        if (e.truck == null) {
            return e.setTruck(truck);
        }
    });
    trucks.push(truck);
}

function submitTruck() {
    let truckSerialized = serializeForm(document.getElementById('truck-form')),
        truck = new Truck(truckSerialized.len, truckSerialized.width, truckSerialized.type, truckSerialized.distance);

    console.log(truck);

    addTruck(truck);
    audio.play();
}

function serializeForm(form) {
    const inputs = form.querySelectorAll('input:not([type="submit"]), select, textarea'),
        result = [];

    inputs.forEach(e => {
        let value = e.value;
        if (e.getAttribute('type') != 'radio' || e.checked)
            result[e.getAttribute('name')] = value;
    });

    return result;
}


function allowDrop(e) {
    e.preventDefault();
}
function drag(e){
    e.dataTransfer.setData('text/plain', e.target.id);
}


function drop(e){
    e.preventDefault();


    let data = e.dataTransfer.getData('text');
    const truck = trucks[e.target.parentElement.getAttribute('data-truck')];
    let x = e.target.getAttribute('data-x'),
        y = e.target.getAttribute('data-y');

    if (checkSpaceAvailable('Box', truck, x, y)){
        const element = document.getElementById(data);
        element.classList.remove('transformable');
        element.style.position = 'static';
        element.setAttribute('hidden', 'true');
        e.target.appendChild(element);
        //TODO change to correct numberth of trailer
        const trailer = document.getElementsByClassName('trailer')[1];
        populateWithBoxes('Box', truck, x, y, document.getElementById(data));
        populateHTMLWithBoxes('Box', trailer, x, y)
        document.getElementById(data).removeAttribute('draggable');
        console.log(e.dataTransfer.getData('text'));
    }


}

function checkSpaceAvailable(shape, truck, x, y){
    x = parseInt(x);
    y = parseInt(y);
    switch (shape){
        case 'T':
            if (x === 0 || y === truck.width - 1 || y === 0) return false;
            if (truck.trailerLoad[x][y] != null) return false;
            if (truck.trailerLoad[x - 1][y] != null) return false;
            if (truck.trailerLoad[x][y - 1] != null) return false;
            if (truck.trailerLoad[x][y + 1] != null) return false;
            return true;
        case 'L':
            if (x >= truck.len - 2 || y === truck.width - 1) return false;
            if (truck.trailerLoad[x][y] != null) return false;
            if (truck.trailerLoad[x + 1][y] != null) return false;
            if (truck.trailerLoad[x + 2][y] != null) return false;
            if (truck.trailerLoad[x][y + 1] != null) return false;
            return true;
        case 'Straight':
            if (y >= truck.width - 3) return false;
            if (truck.trailerLoad[x][y] != null) return false;
            if (truck.trailerLoad[x][y + 1] != null) return false;
            if (truck.trailerLoad[x][y + 2] != null) return false;
            if (truck.trailerLoad[x][y + 3] != null) return false;
            return true;
        case 'Skew':
            if (x <= 0 || y === truck.width - 1 || x === truck.len - 1) return false;
            if (truck.trailerLoad[x][y] != null) return false;
            if (truck.trailerLoad[x + 1][y] != null) return false;
            if (truck.trailerLoad[x][y + 1] != null) return false;
            if (truck.trailerLoad[x - 1][y + 1] != null) return false;
            return true;
        case 'Box':
            if (y === truck.width - 1 || x === truck.len - 1) return false;
            if (truck.trailerLoad[x][y] != null) return false;
            if (truck.trailerLoad[x + 1][y] != null) return false;
            if (truck.trailerLoad[x][y + 1] != null) return false;
            if (truck.trailerLoad[x + 1][y + 1] != null) return false;
            return true;
    }
}

function populateWithBoxes(shape, truck, x, y, box){
    x = parseInt(x);
    y = parseInt(y);
    switch (shape){
        case 'T':
            truck.trailerLoad[x][y] = box;
            truck.trailerLoad[x - 1][y] = box;
            truck.trailerLoad[x][y - 1] = box;
            truck.trailerLoad[x][y + 1] = box;
            break
        case 'L':
            truck.trailerLoad[x][y] = box;
            truck.trailerLoad[x + 1][y] = box;
            truck.trailerLoad[x + 2][y] = box;
            truck.trailerLoad[x][y + 1] = box;
            break
        case 'Straight':
            truck.trailerLoad[x][y] = box;
            truck.trailerLoad[x][y + 1] = box;
            truck.trailerLoad[x][y + 2] = box;
            truck.trailerLoad[x][y + 3] = box;
            break
        case 'Skew':
            truck.trailerLoad[x][y] = box;
            truck.trailerLoad[x + 1][y] = box;
            truck.trailerLoad[x][y + 1] = box;
            truck.trailerLoad[x - 1][y + 1] = box;
            break
        case 'Box':
            truck.trailerLoad[x][y] = box;
            truck.trailerLoad[x + 1][y] = box;
            truck.trailerLoad[x][y + 1] = box;
            truck.trailerLoad[x + 1][y + 1] = box;
            break
    }
}

function populateHTMLWithBoxes(shape, trailer, x, y){
    x = parseInt(x);
    y = parseInt(y);
    const elements = trailer.getElementsByClassName('dropzone');
    switch (shape) {
        case 'T':
            for (let i = 0; i < elements.length; i++) {
                const elementX = elements[i].getAttribute('data-x');
                const elementY = elements[i].getAttribute('data-y');
                if (elementX === x.toString() && elementY === y.toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === (x - 1).toString() && elementY === y.toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === x.toString() && elementY === (y - 1).toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === x.toString() && elementY === (y + 1).toString()) elements[i].style.backgroundColor = '#ffffff';
            }
            break
        case 'L':
            for (let i = 0; i < elements.length; i++) {
                const elementX = elements[i].getAttribute('data-x');
                const elementY = elements[i].getAttribute('data-y');
                if (elementX === x.toString() && elementY === y.toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === (x + 1).toString() && elementY === y.toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === (x + 2).toString() && elementY === y.toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === x.toString() && elementY === (y + 1).toString()) elements[i].style.backgroundColor = '#ffffff';
            }
            break
        case 'Straight':
            for (let i = 0; i < elements.length; i++) {
                const elementX = elements[i].getAttribute('data-x');
                const elementY = elements[i].getAttribute('data-y');
                if (elementX === x.toString() && elementY === y.toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === x.toString() && elementY === (y + 1).toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === x.toString() && elementY === (y + 2).toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === x.toString() && elementY === (y + 3).toString()) elements[i].style.backgroundColor = '#ffffff';
            }
            break
        case 'Skew':
            for (let i = 0; i < elements.length; i++) {
                const elementX = elements[i].getAttribute('data-x');
                const elementY = elements[i].getAttribute('data-y');
                if (elementX === x.toString() && elementY === y.toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === (x + 1).toString() && elementY === y.toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === x.toString() && elementY === (y + 1).toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === (x - 1).toString() && elementY === (y + 1).toString()) elements[i].style.backgroundColor = '#ffffff';
            }
            break
        case 'Box':
            for (let i = 0; i < elements.length; i++) {
                const elementX = elements[i].getAttribute('data-x');
                const elementY = elements[i].getAttribute('data-y');
                if (elementX === x.toString() && elementY === y.toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === (x + 1).toString() && elementY === y.toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === x.toString() && elementY === (y + 1).toString()) elements[i].style.backgroundColor = '#ffffff';
                if (elementX === (x + 1).toString() && elementY === (y + 1).toString()) elements[i].style.backgroundColor = '#ffffff';
            }
            break
    }
}
