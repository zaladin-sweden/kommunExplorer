// Database management for user municipality visits
class MunicipalityDatabase {
    constructor() {
        this.storageKey = 'swedenMunicipalitiesDB';
        this.currentUser = null;
        this.municipalities = [];
        this.init();
    }

    init() {
        // Load database from localStorage or create new
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            const data = JSON.parse(stored);
            this.users = data.users || {};
            this.currentUser = data.currentUser || null;
        } else {
            this.users = {};
            this.currentUser = null;
        }
    }

    save() {
        const data = {
            users: this.users,
            currentUser: this.currentUser
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // Create a new user with all 290 municipalities
    createUser(username) {
        if (!username || this.users[username]) {
            return false;
        }

        this.users[username] = {};
        this.municipalities.forEach(municipality => {
            this.users[username][municipality] = {
                name: municipality,
                visited: false
            };
        });

        this.save();
        return true;
    }

    // Delete a user
    deleteUser(username) {
        if (!this.users[username]) {
            return false;
        }

        delete this.users[username];
        if (this.currentUser === username) {
            this.currentUser = null;
        }
        this.save();
        return true;
    }

    // Set current active user
    setCurrentUser(username) {
        if (!this.users[username]) {
            return false;
        }
        this.currentUser = username;
        this.save();
        return true;
    }

    // Get all users
    getUsers() {
        return Object.keys(this.users);
    }

    // Get current user's data
    getCurrentUserData() {
        if (!this.currentUser || !this.users[this.currentUser]) {
            return null;
        }
        return this.users[this.currentUser];
    }

    // Toggle visited status for a municipality
    toggleVisited(municipalityName) {
        if (!this.currentUser || !this.users[this.currentUser]) {
            return false;
        }

        const userData = this.users[this.currentUser];
        if (userData[municipalityName]) {
            userData[municipalityName].visited = !userData[municipalityName].visited;
            this.save();
            return userData[municipalityName].visited;
        }
        return false;
    }

    // Check if municipality is visited
    isVisited(municipalityName) {
        if (!this.currentUser || !this.users[this.currentUser]) {
            return false;
        }

        const userData = this.users[this.currentUser];
        return userData[municipalityName] ? userData[municipalityName].visited : false;
    }

    // Get statistics for current user
    getStats() {
        if (!this.currentUser || !this.users[this.currentUser]) {
            return { visited: 0, remaining: 290, percentage: 0 };
        }

        const userData = this.users[this.currentUser];
        const visited = Object.values(userData).filter(m => m.visited).length;
        const total = Object.keys(userData).length;
        const remaining = total - visited;
        const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;

        return { visited, remaining, percentage };
    }

    // Reset all municipalities for current user
    resetAll() {
        if (!this.currentUser || !this.users[this.currentUser]) {
            return false;
        }

        const userData = this.users[this.currentUser];
        Object.keys(userData).forEach(key => {
            userData[key].visited = false;
        });
        this.save();
        return true;
    }

    // Set municipality list (called when GeoJSON is loaded)
    setMunicipalities(municipalityList) {
        this.municipalities = municipalityList;
        
        // Update existing users with any new municipalities
        Object.keys(this.users).forEach(username => {
            municipalityList.forEach(municipality => {
                if (!this.users[username][municipality]) {
                    this.users[username][municipality] = {
                        name: municipality,
                        visited: false
                    };
                }
            });
        });
        this.save();
    }

    // Export data
    exportData() {
        return JSON.stringify({
            users: this.users,
            currentUser: this.currentUser,
            exportDate: new Date().toISOString()
        }, null, 2);
    }

    // Import data
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.users) {
                this.users = data.users;
                this.currentUser = data.currentUser || null;
                this.save();
                return true;
            }
            return false;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }
}

// Create global database instance
const db = new MunicipalityDatabase();
