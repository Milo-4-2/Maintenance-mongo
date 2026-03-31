// ============================================
// Task Model (Data Layer)
// Defines the Mongoose schema for tasks, including
// embedded sub-schemas for subtasks, comments,
// and modification history.
// Only imported by taskRepository (clean architecture).
// ============================================

const mongoose = require('mongoose');

// --- Sub-schema: Subtask ---
// Each task can contain up to 20 subtasks
const subtaskSchema = new mongoose.Schema({
    titre: {
        type: String,
        required: [true, 'Le titre de la sous-tâche est requis'],
        trim: true,
        minlength: [3, 'Le titre doit contenir au moins 3 caractères'],
        maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
    },
    statut: {
        type: String,
        enum: ['à faire', 'en cours', 'terminée'], // to do, in progress, completed
        default: 'à faire'
    },
    echeance: { type: Date } // optional deadline
}, { timestamps: true });

// --- Sub-schema: Comment ---
// Each task can hold up to 50 comments
const commentaireSchema = new mongoose.Schema({
    auteur: {
        type: String,
        required: [true, 'L\'auteur du commentaire est requis'],
        trim: true,
        minlength: [2, 'Le nom de l\'auteur doit contenir au moins 2 caractères'],
        maxlength: [50, 'Le nom de l\'auteur ne peut pas dépasser 50 caractères']
    },
    texte: {
        type: String,
        required: [true, 'Le texte du commentaire est requis'],
        trim: true,
        minlength: [1, 'Le commentaire ne peut pas être vide'],
        maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères']
    },
    date: { type: Date, default: Date.now }
});

// --- Sub-schema: History entry ---
// Tracks creation, modification, and deletion events
const historiqueSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['création', 'modification', 'suppression'] // creation, modification, deletion
    },
    date: { type: Date, default: Date.now },
    details: {
        type: String,
        maxlength: [200, 'Les détails ne peuvent pas dépasser 200 caractères']
    }
});

// --- Main Task Schema ---
const taskSchema = new mongoose.Schema({
    // --- Core Fields ---
    titre: {
        type: String,
        required: [true, 'Le titre est requis'],
        trim: true,
        minlength: [3, 'Le titre doit contenir au moins 3 caractères'],
        maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    // Status: à faire (to do), en cours (in progress), terminée (done), en attente (pending), annulée (cancelled)
    statut: {
        type: String,
        required: true,
        enum: {
            values: ['à faire', 'en cours', 'terminée', 'en attente', 'annulée'],
            message: '{VALUE} n\'est pas un statut valide'
        },
        default: 'à faire'
    },
    // Priority: basse (low), moyenne (medium), haute (high), critique (critical)
    priorite: {
        type: String,
        required: true,
        enum: {
            values: ['basse', 'moyenne', 'haute', 'critique'],
            message: '{VALUE} n\'est pas une priorité valide'
        },
        default: 'moyenne'
    },
    // Creation date — immutable once set
    dateCreation: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    // Deadline — must be after creation date
    echeance: {
        type: Date,
        validate: {
            validator: function(value) {
                return !value || value > this.dateCreation;
            },
            message: 'L\'échéance doit être postérieure à la date de création'
        }
    },
    // --- Author Info (embedded, not a ref) ---
    auteur: {
        nom: {   // Last name
            type: String,
            required: [true, 'Le nom de l\'auteur est requis'],
            trim: true,
            minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
            maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
        },
        prenom: { // First name
            type: String,
            required: [true, 'Le prénom de l\'auteur est requis'],
            trim: true,
            minlength: [2, 'Le prénom doit contenir au moins 2 caractères'],
            maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
        },
        email: {  // Author email contact
            type: String,
            required: [true, 'L\'email de l\'auteur est requis'],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide']
        }
    },
    // --- Classification ---
    categorie: {
        type: String,
        trim: true,
        minlength: [2, 'La catégorie doit contenir au moins 2 caractères'],
        maxlength: [30, 'La catégorie ne peut pas dépasser 30 caractères']
    },
    // Tags — max 10 tags, each 2-20 characters
    etiquettes: {
        type: [String],
        validate: {
            validator: function(arr) {
                return arr.length <= 10 && arr.every(tag => tag.length >= 2 && tag.length <= 20);
            },
            message: 'Maximum 10 étiquettes, chacune entre 2 et 20 caractères'
        }
    },
    // --- Embedded Collections ---
    sousTaches: {   // Subtasks array (max 20)
        type: [subtaskSchema],
        validate: {
            validator: function(arr) {
                return arr.length <= 20;
            },
            message: 'Maximum 20 sous-tâches par tâche'
        }
    },
    commentaires: { // Comments array (max 50)
        type: [commentaireSchema],
        validate: {
            validator: function(arr) {
                return arr.length <= 50;
            },
            message: 'Maximum 50 commentaires par tâche'
        }
    },
    // --- User Assignments (refs to User model) ---
    assignedTo: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        assignedAt: {
            type: Date,
            default: Date.now
        }
    }],
    historique: [historiqueSchema], // Modification history log
    // --- Ownership & Lifecycle ---
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Task must belong to a user']
    },
    // Soft delete fields — task is hidden but not removed from DB
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Submit fields — marks a task as finalized/submitted
    submitted: {
        type: Boolean,
        default: false
    },
    submittedAt: {
        type: Date
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// --- Virtual Fields (computed, not stored in DB) ---

// Progression: percentage of subtasks marked as completed
taskSchema.virtual('progression').get(function() {
    if (!this.sousTaches || this.sousTaches.length === 0) {
        return this.statut === 'terminée' ? 100 : 0;
    }
    const completed = this.sousTaches.filter(st => st.statut === 'terminée').length;
    return Math.round((completed / this.sousTaches.length) * 100);
});

// Overdue: true if deadline has passed and task is not completed
taskSchema.virtual('enRetard').get(function() {
    if (!this.echeance) return false;
    return this.echeance < new Date() && this.statut !== 'terminée';
});

// Pre-save hook: automatically add a 'creation' entry to history for new tasks
taskSchema.pre('save', function(next) {
    if (this.isNew) {
        this.historique.push({
            action: 'création',
            date: new Date(),
            details: `Tâche créée: ${this.titre}`
        });
    }
    next();
});

// --- Database Indexes for query performance ---
taskSchema.index({ statut: 1, priorite: -1 });  // Filter by status + sort by priority
taskSchema.index({ echeance: 1 });               // Sort/filter by deadline
taskSchema.index({ categorie: 1 });              // Filter by category
taskSchema.index({ 'auteur.email': 1 });         // Search by author email
taskSchema.index({ createdBy: 1 });              // Filter tasks by owner
taskSchema.index({ deleted: 1 });                // Separate active vs deleted tasks

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;