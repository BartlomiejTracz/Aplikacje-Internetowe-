const WeatherApp = class{
    constructor(apiKey, resultsBlockSelector){
        this.apiKey = apiKey;
        this.resultsBlock = document.querySelector(resultsBlockSelector)

        this.currentWeatherLink = `https://api.openweathermap.org/data/2.5/weather?q={query}&appid=${this.apiKey}&units=metric`;
        this.forecastLink = `https://api.openweathermap.org/data/2.5/forecast?q={query}&appid=${this.apiKey}&units=metric`;

        this.currentWeather = undefined;
        this.forecast = undefined;
    }

    getCurremtWeather(query){
        let url = this.currentWeatherLink.replace("{query}", query);
        console.log(url);
        let req = new XMLHttpRequest();
        req.open("Get", url, true);
        req.addEventListener("load", () => {
             this.currentWeather = JSON.parse(req.responseText);
             this.drawWeather();
             console.log(this.currentWeather);
        });
        req.send();
    }

    getForecast(query){
        let url = this.forecastLink.replace("{query}", query);
        fetch(url)
        .then((response) => {
            console.log(response);
            return response.json();
        })
        .then((data)=>{
            console.log(data);
            this.forecast = data.list;
            this.drawWeather();
        });
    }

    getWeather(query){
        this.getCurremtWeather(query);
        this.getForecast(query);
    }

    drawWeather(){
        this.resultsBlock.innerHTML = '';
        
        if (this.currentWeather){
            const date = new Date(this.currentWeather.dt * 1000);
            const weatherBlock = this.createWeatherBlock(
                `${date.toLocaleDateString("pl-PL")} ${date.toLocaleTimeString("pl-PL")}`, 
                this.currentWeather.main.temp, 
                this.currentWeather.main.feels_like , 
                this.currentWeather.weather[0].icon, 
                this.currentWeather.weather[0].description 
            )
        // this.resultsBlock.innerText = query;
            this.resultsBlock.appendChild(weatherBlock);
        }

        if(this.forecast != null){
            let lastDateString = '';
            let currentRow = null;
            for(let i= 0; i < this.forecast.length; i++){
                let weather = this.forecast[i];
                const date = new Date(weather.dt * 1000);
                const dateString = date.toLocaleDateString("pl-PL");

                if (dateString !== lastDateString){
                    lastDateString = dateString;

                    currentRow = document.createElement('div');
                    currentRow.className = 'weather-row';

                    const dateHeader = document.createElement('div');
                    dateHeader.className = 'day-header';
                    dateHeader.innerText = dateString;
                    currentRow.appendChild(dateHeader);

                    this.resultsBlock.appendChild(currentRow);
                }

                const weatherBlock = this.createWeatherBlock(
                    `${date.toLocaleDateString("pl-PL")} ${date.toLocaleTimeString("pl-PL")}`, 
                weather.main.temp, 
                weather.main.feels_like , 
                weather.weather[0].icon, 
                weather.weather[0].description 
            );

            if (currentRow) {
                    currentRow.appendChild(weatherBlock);
            }
            }
        }
        
    }

    createWeatherBlock(dateString, temperature, feelsLikeTemperature, iconName, description){
        const weatherBlock = document.createElement("div");
        weatherBlock.className = "Weather-block";
        // weatherBlock.innerText = "Hello"

        const dateBlock= document.createElement("div");
        dateBlock.className = "weather-date";
        dateBlock.innerHTML = dateString;
        weatherBlock.appendChild(dateBlock);

        const temperatureBolock= document.createElement("div");
        temperatureBolock.className = 'weather-temperature';
        temperatureBolock.innerHTML = `${temperature} &deg;C`;
        weatherBlock.appendChild(temperatureBolock);

        const temperatureFeelsLikeBolock= document.createElement("div");
        temperatureFeelsLikeBolock.className = 'weather-temperature-feels-like';
        temperatureFeelsLikeBolock.innerHTML = `Feel: ${feelsLikeTemperature} &deg;C`;
        weatherBlock.appendChild(temperatureFeelsLikeBolock);

        const weatherIconBlock = document.createElement("img");
        weatherIconBlock.className = 'weather-icon';
        weatherIconBlock.src = `https://openweathermap.org/img/wn/${iconName}@2x.png`;
        weatherBlock.appendChild(weatherIconBlock);

        const weatherDescription = document.createElement("div");
        weatherDescription.className='weather-description';
        weatherDescription.innerHTML = description;
        weatherBlock.appendChild(weatherDescription);



        return weatherBlock;
    }
}
    document.weatherApp = new WeatherApp("7eb22987179497d2cabfde6bca360d29","#wether-results-container");

    document.querySelector("#checkButton").addEventListener("click", function() {
        const query = document.querySelector("#locationInput").value;
        //document.weatherApp.getCurremtWeather(query);        
        // document.weatherApp.getForecast(query);
        document.weatherApp.getWeather(query);
});



