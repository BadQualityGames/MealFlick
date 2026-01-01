const API_URL = 'https://www.themealdb.com/api/json/v1/1/random.php';
const wrapper = document.getElementById('swiper-wrapper');

let swiper;

/* Получение рецепта */
async function fetchMeal() {
  const res = await fetch(API_URL);
  const data = await res.json();
  return data.meals[0];
}

/* Получаем ингредиенты */
function getIngredients(meal, limit = 5) {
  const ingredients = [];
  
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient,
        measure: measure || ''
      });
    }
  }
  
  return ingredients.slice(0, limit);
}

/* Получаем все ингредиенты для полного рецепта */
function getAllIngredients(meal) {
  const ingredients = [];
  
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient,
        measure: measure || ''
      });
    }
  }
  
  return ingredients;
}

/* Оценка времени приготовления */
function getCookingTime(ingredientCount) {
  if (ingredientCount <= 5) return '≈20–30 min';
  if (ingredientCount <= 10) return '≈30–45 min';
  return '≈45–60 min';
}

function calculateRealisticCalories(meal) {
  const ingredients = getAllIngredients(meal);
  let totalCalories = 0;
  
  ingredients.forEach(item => {
    const ing = item.name.toLowerCase();
    
    if (ing.includes('chicken') || ing.includes('beef') || ing.includes('pork') || ing.includes('meat')) {
      totalCalories += 150;
    } else if (ing.includes('rice') || ing.includes('pasta') || ing.includes('potato') || ing.includes('bread')) {
      totalCalories += 120;
    } else if (ing.includes('cheese') || ing.includes('cream') || ing.includes('butter') || ing.includes('milk')) {
      totalCalories += 100;
    } else if (ing.includes('oil') || ing.includes('butter') || ing.includes('fat')) {
      totalCalories += 80;
    } else if (ing.includes('vegetable') || ing.includes('tomato') || ing.includes('onion') || ing.includes('carrot')) {
      totalCalories += 30;
    } else if (ing.includes('egg')) {
      totalCalories += 70;
    } else {
      totalCalories += 40;
    }
  });
  
  totalCalories += 150;
  return Math.round(totalCalories / 10) * 10;
}

/* Создание карточки */
function createSlide(meal) {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide';

  const ingredients = getIngredients(meal);
  const allIngredients = getAllIngredients(meal);
  const cookTime = getCookingTime(allIngredients.length);
  const calories = calculateRealisticCalories(meal);

  slide.innerHTML = `
    <div class="card" data-meal-id="${meal.idMeal}">
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-image" data-meal-id="${meal.idMeal}">
      <div class="card-content">
        <div class="header-row">
          <h2>${meal.strMeal}</h2>
          <div class="country-tag">${meal.strArea}</div>
        </div>

        <div class="meta">
          <span>⏱️ ${cookTime}</span>
          <span>🔥 ≈${calories} kcal</span>
        </div>

        <p class="ingredients">
          <strong>Ingredients:</strong> ${ingredients.map(item => item.name).join(', ')}
        </p>
      </div>
    </div>
  `;

  // Добавляем обработчик клика на изображение
  const img = slide.querySelector('.recipe-image');
  img.addEventListener('click', () => {
    openRecipeModal(meal);
  });

  return slide;
}

/* Создание модального окна с полным рецептом */
function openRecipeModal(meal) {
  // Создаем модальное окно
  const modal = document.createElement('div');
  modal.className = 'recipe-modal';
  
  const allIngredients = getAllIngredients(meal);
  
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <button class="close-modal">&times;</button>
      
      <div class="modal-header">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="modal-image">
        <div class="modal-title">
          <h2>${meal.strMeal}</h2>
          <div class="modal-tags">
            <span class="tag">${meal.strArea}</span>
            <span class="tag">${meal.strCategory}</span>
            <span class="tag">${getCookingTime(allIngredients.length)}</span>
            <span class="tag">≈${calculateRealisticCalories(meal)} kcal</span>
          </div>
        </div>
      </div>
      
      <div class="modal-body">
        <div class="ingredients-section">
          <h3>📋 Ingredients</h3>
          <ul class="ingredients-list">
            ${allIngredients.map(item => 
              `<li><span class="ingredient-name">${item.name}</span> <span class="ingredient-measure">${item.measure}</span></li>`
            ).join('')}
          </ul>
        </div>
        
        <div class="instructions-section">
          <h3>👨‍🍳 Сoking</h3>
          <div class="instructions">
            ${meal.strInstructions.split('\n').filter(step => step.trim()).map((step, index) => 
              `<p><strong>Step ${index + 1}:</strong> ${step}</p>`
            ).join('')}
          </div>
        </div>
        
      </div>
      
      <div class="modal-footer">
        <button class="close-btn">Close</button>
      </div>
    </div>
  `;
  
  // Добавляем модальное окно в body
  document.body.appendChild(modal);
  
  // Блокируем прокрутку фона
  document.body.style.overflow = 'hidden';
  
  // Обработчики закрытия
  const closeModal = () => {
    document.body.removeChild(modal);
    document.body.style.overflow = 'auto';
  };
  
  modal.querySelector('.close-modal').addEventListener('click', closeModal);
  modal.querySelector('.close-btn').addEventListener('click', closeModal);
  modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
  
  // Закрытие по Escape
  document.addEventListener('keydown', function closeOnEscape(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', closeOnEscape);
    }
  });
}

/* Загрузка карточек */
async function loadMeals(count = 3) {
  for (let i = 0; i < count; i++) {
    const meal = await fetchMeal();
    const slide = createSlide(meal);
    wrapper.appendChild(slide);
    swiper.update();
  }
}

/* Swiper */
swiper = new Swiper('.swiper', {
  slidesPerView: 1,
  spaceBetween: 20,
  on: {
    slideChange: async () => {
      if (swiper.activeIndex >= swiper.slides.length - 2) {
        await loadMeals(2);
      }
    }
  }
});

/* Старт */
loadMeals(5);