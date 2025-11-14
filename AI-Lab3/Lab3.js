document.addEventListener('DOMContentLoaded', function() {

    const locButton = document.getElementById('loc');
    const thirdBox = document.getElementById('third-box');
    const fourthBox = document.getElementById('fourth-box');
    const captureButton = document.getElementById('btn-capture');
    const captureContainer = document.getElementById('map-capture-container');

    const ROWS = 4;
    const COLS = 4;
    const PIECES = ROWS * COLS;

    let userMarker = null;
    let puzzleIdCounter = 0;
    let draggedPiece = null;
    let originalParent = null;


    const map = L.map('map', {
        zoomControl: true,
        minZoom: 3,
        maxZoom: 18
    }).setView([53.426091, 14.551425], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        tileSize: 256,
        zoomOffset: 0
    }).addTo(map);


    function success(pos) {
        const crd = pos.coords;
        const userLat = crd.latitude;
        const userLng = crd.longitude;

        console.log(`Twoja lokalizacja: ${userLat}, ${userLng}`);

        if (userMarker) {
            map.removeLayer(userMarker);
        }

        userMarker = L.marker([userLat, userLng]).addTo(map)
            .openPopup();

        map.setView([userLat, userLng], 15);
    }

    function error(err) {
        console.warn(`BŁĄD ${err.code}: ${err.message}`);
        alert('Nie udało się pobrać lokalizacji. Sprawdź, czy masz włączoną geolokalizację i czy wyraziłeś zgodę.');
    }

    function getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        } else {
            alert('Twoja przeglądarka nie wspiera geolokalizacji.');
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            return Notification.requestPermission();
        }
        return Promise.resolve(Notification.permission);
    }

    function sendWinNotification() {
        const notificationTitle = "Puzzle ułożone - super :)";
        const notificationBody = "ułożyłeś najbardziej skomplikowane puzzle na świecie"
        

        if (!('Notification' in window)) {
            alert(notificationTitle + "\n" + notificationBody + " (Brak wsparcia dla powiadomień)");
            return;
        }

        console.log('puzzle poprawnie ułożone')
        requestNotificationPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(notificationTitle, {
                body: notificationBody,
                icon: 'https://i.imgur.com/8Q73v2n.png'
                });
            } else if (permission === 'denied') {
                 console.error("Powiadomienia zablokowane przez użytkownika.");
                 alert(notificationTitle + "\n" + notificationBody + "\n(Powiadomienia zostały zablokowane - sprawdź ustawienia przeglądarki)");
            }
        });
    }

    function checkWinCondition() {
        const allElementsInTarget = Array.from(fourthBox.children);

        if (allElementsInTarget.length !== PIECES) {
            console.log(`Wymagane ${PIECES} elementów, znaleziono ${allElementsInTarget.length}.`);
            return false;
        }

        for (let i = 0; i < allElementsInTarget.length; i++) {
            const el = allElementsInTarget[i];

            if (!el.classList.contains("puzzle-piece")) {
                console.log(`Element pod indeksem ${i} nie jest częścią układanki.`);
                return false;
            }

            const correctIndex = parseInt(el.dataset.correctIndex, 10);

            if (correctIndex !== i) {
                console.log(`Element ${el.id} jest na pozycji ${i}, ale jego poprawna pozycja to ${correctIndex}.`);
                return false;
            }
        }

        return true;
    }

    function createEmptySlot(index) {
        const slot = document.createElement('div');
        slot.classList.add('puzzle-slot');

        if (index !== null) {
            slot.dataset.slotIndex = index.toString();
            slot.textContent = `Nr ${index + 1}`;
        }

        slot.addEventListener("dragover", function(event) {
            if (draggedPiece && originalParent && originalParent.id === 'third-box') {
                event.preventDefault();
            }
        });

        slot.addEventListener("dragenter", function(event) {
            if (draggedPiece && originalParent && originalParent.id === 'third-box') {
                this.classList.add('drag-over');
            }
        });

        slot.addEventListener("dragleave", function(event) {
            this.classList.remove('drag-over');
        });

        slot.addEventListener("drop", function(event) {
            event.preventDefault();
            this.classList.remove('drag-over');

            const draggedId = event.dataTransfer.getData("text/plain");
            const draggedElement = document.getElementById(draggedId);
            const targetSlot = this;

            if (draggedElement &&
                draggedElement.classList.contains('puzzle-piece') &&
                originalParent && originalParent.id === 'third-box')
            {
                targetSlot.parentNode.replaceChild(draggedElement, targetSlot);
                originalParent = null;

                if (checkWinCondition()) {
                    sendWinNotification();
                }
            }
        });

        return slot;
    }

    function setupTargetSlots() {
        fourthBox.innerHTML = '';
        for (let i = 0; i < PIECES; i++) {
            const slot = createEmptySlot(i);
            fourthBox.appendChild(slot);
        }
    }

    function addDragListeners(pieces) {
        pieces.forEach(piece => {
            piece.draggable = true;
            piece.id = `puzzle-piece-${puzzleIdCounter++}`;

            piece.addEventListener("dragstart", function(event) {
                this.classList.add('dragging');
                event.dataTransfer.setData("text/plain", this.id);
                draggedPiece = this;
                originalParent = this.parentNode;
            });

            piece.addEventListener("dragend", function(event) {
                this.classList.remove('dragging');
                draggedPiece = null;
                originalParent = null;
            });

            piece.addEventListener("dragover", function(event) {
                if (draggedPiece && this.parentNode.id === originalParent.id) {
                    event.preventDefault();
                }
            });

            piece.addEventListener("drop", function (event) {
                event.preventDefault();
                event.stopPropagation();
                this.classList.remove('drag-over');

                const targetPiece = this;
                const currentParent = targetPiece.parentNode;

                if (draggedPiece &&
                    draggedPiece !== targetPiece &&
                    currentParent.id === originalParent.id)
                {
                    const draggedNextSibling = draggedPiece.nextSibling;

                    currentParent.insertBefore(draggedPiece, targetPiece);
                    currentParent.insertBefore(targetPiece, draggedNextSibling);

                    if (currentParent.id === 'fourth-box' && checkWinCondition()) {
                        sendWinNotification();
                    }
                }
            });

            piece.addEventListener("dragenter", function (event) {
                if (draggedPiece && draggedPiece !== this && this.parentNode.id === originalParent.id) {
                    this.classList.add('drag-over');
                }
            });

            piece.addEventListener("dragleave", function (event) {
                this.classList.remove('drag-over');
            });

        });
    }


    function createJigsawPuzzle(canvas) {
        const pieceWidth = canvas.width / COLS;
        const pieceHeight = canvas.height / ROWS;

        thirdBox.style.gridTemplateColumns = `repeat(${COLS}, ${pieceWidth}px)`;
        fourthBox.style.gridTemplateColumns = `repeat(${COLS}, ${pieceWidth}px)`;

        setupTargetSlots();
        thirdBox.innerHTML = '';

        const pieces = [];
        for (let i = 0; i < PIECES; i++) {
            const row = Math.floor(i / COLS);
            const col = i % COLS;

            const pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = pieceWidth;
            pieceCanvas.height = pieceHeight;
            const ctx = pieceCanvas.getContext('2d');

            ctx.drawImage(canvas, col * pieceWidth, row * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);

            pieceCanvas.classList.add('puzzle-piece');
            pieceCanvas.dataset.correctIndex = i.toString();
            pieces.push(pieceCanvas);
        }

        addDragListeners(pieces);

        shuffleArray(pieces).forEach(piece => {
            thirdBox.appendChild(piece);
        });

        console.log("Puzzle zostały wygenerowane i wymieszane!");
    }

    function captureMap() {
        captureContainer.innerHTML = '';

        let markerWasPresent = false;
        if (userMarker) {
            map.removeLayer(userMarker);
            markerWasPresent = true;
        }

        leafletImage(map, function(err, canvas) {
            if (markerWasPresent && userMarker) {
                map.addLayer(userMarker);
            }

            if (err) {
                console.error("Błąd podczas generowania obrazu:", err);
                captureContainer.innerHTML = '<p style="text-align:center; color:#d00;">Błąd generowania mapy.</p>';
                thirdBox.innerHTML = '<p style="text-align:center; color:#d00;">Błąd generowania puzzli.</p>';
                return;
            }

            canvas.style.width = '500px';
            canvas.style.height = '500px';
            canvas.style.border = '1px solid #333';
            canvas.style.display = 'block';
            captureContainer.appendChild(canvas);

            createJigsawPuzzle(canvas);
        });
    }

    if (locButton) {
        locButton.addEventListener('click', getCurrentLocation);
    } else {
        console.error("Brak elementu o id='loc' w HTML.");
    }

    if (captureButton) {
        captureButton.addEventListener('click', captureMap);
    } else {
        console.error("Brak elementu o id='btn-capture' w HTML.");
    }
});