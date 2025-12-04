const msg: string = "Hello!"; 
alert(msg); 

const style: Record<string, string> = {
    'Style1': 'style-1.css',
    'Style2': 'style-2.css',
    'Style3': 'style-3.css'
}

let currentSyleLink: HTMLLinkElement | null = null;

function changeStyle(styleName: string): void {
    if (currentSyleLink) {
        document.head.removeChild(currentSyleLink);
    }

    //tworzenie linku
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = style[styleName];

    //podłaczanie 
    document.head.appendChild(link);
    currentSyleLink = link;
    console.log(`Style changed to: ${styleName}`);
}

function setupStyleButtons(): void {
    const container = document.getElementById('style-menu');
    if (!container) return;

    Object.keys(style).forEach(styleName => {
        //przejscie po tablicy i tworzenie przycisków
        const button = document.createElement('button');
        button.innerText = styleName;
        //na kliknięcie zmienia stylu na ten o wskazanej nazwie
        button.onclick = () => changeStyle(styleName);
        container.appendChild(button);
    });
}

setupStyleButtons();
changeStyle('Style1');