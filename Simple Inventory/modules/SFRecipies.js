const iRecipe = (() => {
    const _data = new Map();
    const _config = {
        minDifficulty : 50,
        minRate       : 10,
        maxRate       : 100,
        diffRatio     : 10,
        minTime       : 10  // seconds
    };

    class Recipes {
        constructor(recipeId, resultId, time, options) {
            this.id = recipeId;
            this.production = resultId;
            this.time = time ?? _config.minTime;
            for (const [key, value] of Object.entries(options)) {
                if (!this[key]) {
                    this[key] = value;
                }
            }
        }

        // set unlock condition
        Unlock(callback) {
            this.unlock = callback;
            return this;
        }

        // check succes or fail while crafting
        craftCheck() {
            const { skill, difficulty, rate } = this;
            const roll = Random(1, _config.maxRate);
            let finalrate = rate;

            if (skill && V[skill]) {
                let diff = 0;
                const difficul = difficulty ?? _config.minDifficulty;

                if (V[skill] < difficul) {
                    diff = (difficul - V[skill]) / _config.diffRatio;
                    finalrate = Math.clamp(rate + diff, _config.minRate, 100);
                }
                else {
                    diff = (V[skill] - difficul) / _config.diffRatio;
                    finalrate = Math.clamp(rate - diff, _config.minRate, 100);
                }
            }

            if (rate && roll > finalrate) {
                return false;
            }

            return true;
        }
    }

    function _addRecipe(productionId, recipeId = null, recipeOptions) {
        const id = recipeId !== null ? `${productionId}:${recipeId}` : productionId;
        const data = new Recipes(id, productionId, recipeOptions.time ?? _config.minTime, recipeOptions);

        _data.set(id, data);
        return data;
    }

    function _batchAddRecipes(...recipes) {
        recipes.forEach(recipe => {
            _addRecipe(recipe.production, recipe.rId, recipe);
        });
    }

    function _findByProduction(productionId) {
        const keys = [..._data.keys()];
        return keys.filter(key => key.startsWith(productionId));
    }

    function _findByIngredients(...ingredients) {
        const keys = [..._data.values()];
        return keys.filter(recipe => recipe.ingredients && recipe.ingredients.has(ingredients) == ingredients.length);
    }

    function _searchByCondition(condition) {
        const keys = [..._data.values()];
        return keys.filter(recipe => condition(recipe));
    }

    Object.defineProperty(window, 'Recipes', {
        value : Recipes
    });

    return Object.freeze({
        get data() {
            return _data;
        },
        get config() {
            return _config;
        },
        new    : _addRecipe,
        add    : _batchAddRecipes,
        find   : _findByProduction,
        search : _findByIngredients,
        lookUp : _searchByCondition
    });
})();
