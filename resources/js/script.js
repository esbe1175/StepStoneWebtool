document.addEventListener("DOMContentLoaded", function () {

    //-----------------------------
    // END-USER FUNCTIONALITY
    //-----------------------------

    let currentSlide = 1;
    const totalSlides = document.querySelectorAll('.container').length;

    // List of slides on the page. All ".container" classified elements
    const slides = {
        SPLASH: 1,
        SETUP: 2,
        COMPANY_NAME: 3,
        COLORS: 4,
        INDUSTRY: 5,
        KEY_VALUES: 6,
        SLOGAN: 7,
        LOGO_LOADING: 8,
        RESULTS: 9
    }

    //-----------------------------
    // DEBUG DEFINITIONS

    const debugImageGenerationPrompt = false; // For development/debugging. Instead of using up generations to see results, just show the constructed prompt in an alert
    const devStartSlide = slides.SPLASH; // For development/debugging. Sets the starting slide to a specific slide so you don't have to click through and fill out. When not in use should be set to SPLASH (first slide)

    // END DEBUG DEFINITIONS
    //-----------------------------

    // Template for generating the prompt for logo generation
    const promptTemplate = ({ companyName, industry, keyValues, slogan, selectedColor }) => {
        return `a minimalistic logo for a business called "${companyName}" in the "${industry}" industry using a ${colors[selectedColor.toUpperCase()]} color scheme. ${keyValues ? `Their key values are: "${keyValues}".` : ""} ${slogan ? `Their slogan is: "${slogan}".` : ""} Emphasize a minimalistic style, and use few shapes. Imagine it will be a logo for a big corporate. Do not incorporate the slogan/key values, use it for inspiration.`
    }

    // List of formatted colors for use in assembling the prompt in the template
    const colors = {
        RED: 'red',
        BLUE: 'blue',
        GREEN: 'green',
        MIDNIGHT: 'dark and purple',
        LIGHTNING: 'orange and yellow',
        BUSINESS: 'dark and light blue',
        MYC: 'magenta, yellow and cyan',
        SLATE: 'light earthy browns',
        SUNSET: 'dark, orange and yellow colors'
    }

    // Function to show a specific slide based on slide number
    function showSlide(slideNumber) {
        const slides = document.querySelectorAll('.container');
        const currentSlide = Array.from(slides).find(container => container.style.display === 'flex');
        const nextSlide = Array.from(slides).find(container => parseInt(container.getAttribute('data-slide')) === slideNumber); //using data-slide to keep the html nice and readable

        if (currentSlide) {
            return new Promise((resolve) => {
                // Handle visisbility and opacity animation for each slide.  Wait for animation to end before showing next slide
                // Without this, two slides will squish eachother which looks odd
                currentSlide.classList.remove('visible');
                currentSlide.addEventListener('transitionend', function handler() {
                    currentSlide.style.display = 'none';
                    currentSlide.removeEventListener('transitionend', handler);
                    resolve();
                });
            }).then(() => {
                // Set display: flex; for active slide, and give it the .visible classifier for animation
                nextSlide.style.display = 'flex';
                requestAnimationFrame(() => {
                    nextSlide.classList.add('visible');
                });
            });
        } else {
            nextSlide.style.display = 'flex';
            requestAnimationFrame(() => {
                nextSlide.classList.add('visible');
            });
        }
    }

    let apiKey, companyName, industry, keyValues, slogan;
    let selectedColor = "red";

    // Function to generate a logo using the API
    async function generateLogo() {
        // Request content. Fill in prompt, request the right model, dimensions... Note: For Dalle-3, dimensions must be one of 1024x1024, 1792x1024, 1024x1792 https://community.openai.com/t/charges-for-dall-e-3-model-for-image/675469/5
        const prompt = promptTemplate({ companyName, industry, keyValues, slogan, selectedColor })

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: "1024x1024" })
        };

        const response = await fetch('https://api.openai.com/v1/images/generations', options)
        return (await response.json()).data[0].url
    }

    // Function to regenerate the logo
    async function regenerate() {
        if (debugImageGenerationPrompt) {
            const prompt = promptTemplate({ companyName, industry, keyValues, slogan, selectedColor })
            alert(prompt)
            return
        }

        // Boot the user back to the loading screen while awaiting the response.
        if (currentSlide != slides.LOGO_LOADING) {
            currentSlide = slides.LOGO_LOADING
            showSlide(currentSlide);
        }

        // Reset count. (so it doesn't say 3/3 until first image comes in.)
        document.getElementById("resultsMiddle").innerHTML = "";
        document.getElementById("progress").innerHTML = `0/3`

        for (let index = 0; index < 3; index++) {
            const generateImageUrl = await generateLogo()
            const img = document.createElement("img");
            img.src = generateImageUrl;
            document.getElementById("progress").innerHTML = `${index + 1}/3`
            document.getElementById("resultsMiddle").appendChild(img);
        }

        currentSlide = slides.RESULTS;
        showSlide(currentSlide);
    }

    // Function to navigate to the next slide and validate input
    function nextSlide() {
        if (currentSlide == slides.SETUP) {
            apiKey = document.querySelector("#apiKey")?.value.trim()
            if (
                apiKey?.lastIndexOf('sk-', 0) !== 0 ||
                apiKey?.length < 51
            ) {
                // example (Non-valid key: sk-1234ABCD5678EFGH9012IJKL3456MNOP) All keys start with sk-.
                // Note: OpenAI recently introduced project keys (sk-project-), which the function will *not* validate, even if the request would.
                alert("Please check your API key, it should start with sk- and be at least 52 characters long, we can not do our magic without it!")
                return
            }
        }

        // Get company name. Required.
        if (currentSlide == slides.COMPANY_NAME) {
            companyName = document.querySelector("#companyName")?.value.trim()
            if (companyName?.length < 1) {
                alert("Please enter a company name! Hard to make a logo without it :)")
                return
            }
        }

        // Get industry based on pre-set radio or custom text input radio
        if (currentSlide == slides.INDUSTRY) {
            industry = document.querySelector('.radio-button.checked input[type="radio"]')?.value || document.querySelector("#customInput")?.value?.trim()
            if (
                (!document.querySelector('.radio-button.checked') && !document.querySelector(".custom-input.checked")) ||
                (industry?.length < 1)
            ) {
                alert("Please select or tell us your industry!")
                return
            }
        }

        // Get Key Values. Optional (Some people don't think that far.)
        if (currentSlide == slides.KEY_VALUES) {
            keyValues = document.querySelector("#keyValues")?.value?.trim()
        }

        // Get Sloagan. Optional (Not everybody has a slogan.)
        if (currentSlide == slides.SLOGAN) {
            slogan = document.querySelector("#slogan")?.value?.trim()
        }

        // Increment and show slide after validation.
        currentSlide++;
        if (currentSlide > totalSlides) {
            currentSlide = 1;
        }
        showSlide(currentSlide);

        // if we're on LOGO_LOADING, generate the images.
        if (currentSlide == slides.LOGO_LOADING) {
            regenerate()
        }
    }

    // Function to navigate to the previous slide
    function previousSlide() {
        currentSlide--;
        if (currentSlide < 1) {
            currentSlide = totalSlides;
        }
        showSlide(currentSlide);
    }


    //-----------------------------
    // EVENT LISTENERS
    //-----------------------------

    // Event listeners for continue buttons to navigate to the next slide
    document.querySelectorAll('.continueButton').forEach(button => {
        button.addEventListener('click', nextSlide);
    });

    // Event listeners for back buttons to navigate to the previous slide
    document.querySelectorAll('.backButton').forEach(button => {
        button.addEventListener('click', previousSlide);
    });

    currentSlide = devStartSlide;
    showSlide(currentSlide);

    // Automatically navigate to the next slide after 2 seconds if on the splash slide
    if (currentSlide === 1 && devStartSlide === 1) {
        setTimeout(nextSlide, 2000);
    }

    const radioButtons = document.querySelectorAll('.radio-button input[type="radio"]');
    const customInput = document.getElementById('customInput');

    // Event listener to handle radio button selection
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            document.querySelectorAll('.radio-button, .custom-input').forEach(div => {
                div.classList.remove('checked');
            });
            if (this.checked) {
                this.parentElement.classList.add('checked');
            }
        });
    });

    // Event listeners for color selection buttons
    document.querySelectorAll('.colorSelectButton').forEach(button => {
        button.addEventListener('click', function (e) {
            selectedColor = this.getAttribute('data-color');
            document.querySelectorAll('.colorSelectButton').forEach(button => {
                if (button.getAttribute('data-color') != selectedColor) {
                    button.classList.remove('selected')
                } else {
                    button.classList.add('selected')
                }
            })
        });
    });

    // Event listener for regenerate button
    document.querySelector("#regenerateButton").addEventListener('click', function () {
        regenerate()
    })

    // Event listener for custom input focus
    customInput.addEventListener('focus', function () {
        document.querySelectorAll('.radio-button, .custom-input').forEach(div => {
            div.classList.remove('checked');
        });
        document.getElementById('custom').parentElement.classList.add('checked');
    });
});
