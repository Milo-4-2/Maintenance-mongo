const mongoose = require('mongoose');

// Sub-schema for subtasks
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
        enum: ['à faire', 'en cours', 'terminée'],
        default: 'à faire'
    },
    echeance: {
        type: Date
    }
}, { timestamps: true });

// Sub-schema for comments
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
    date: {
        type: Date,
        default: Date.now
    }
});

// Sub-schema for modification history
const historiqueSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['création', 'modification', 'suppression']
    },
    date: {
        type: Date,
        default: Date.now
    },
    details: {
        type: String,
        maxlength: [200, 'Les détails ne peuvent pas dépasser 200 caractères']
    }
});

// Main Task schema
const taskSchema = new mongoose.Schema({
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
    statut: {
        type: String,
        required: true,
        enum: {
            values: ['à faire', 'en cours', 'terminée', 'en attente', 'annulée'],
            message: '{VALUE} n\'est pas un statut valide'
        },
        default: 'à faire'
    },
    priorite: {
        type: String,
        required: true,
        enum: {
            values: ['basse', 'moyenne', 'haute', 'critique'],
            message: '{VALUE} n\'est pas une priorité valide'
        },
        default: 'moyenne'
    },
    dateCreation: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    echeance: {
        type: Date,
        validate: {
            validator: function(value) {
                return !value || value > this.dateCreation;
            },
            message: 'L\'échéance doit être postérieure à la date de création'
        }
    },
    auteur: {
        nom: {
            type: String,
            required: [true, 'Le nom de l\'auteur est requis'],
            trim: true,
            minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
            maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
        },
        prenom: {
            type: String,
            required: [true, 'Le prénom de l\'auteur est requis'],
            trim: true,
            minlength: [2, 'Le prénom doit contenir au moins 2 caractères'],
            maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
        },
        email: {
            type: String,
            required: [true, 'L\'email de l\'auteur est requis'],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide']
        }
    },
    categorie: {
        type: String,
        trim: true,
        minlength: [2, 'La catégorie doit contenir au moins 2 caractères'],
        maxlength: [30, 'La catégorie ne peut pas dépasser 30 caractères']
    },
    etiquettes: {
        type: [String],
        validate: {
            validator: function(arr) {
                return arr.length <= 10 && arr.every(tag => tag.length >= 2 && tag.length <= 20);
            },
            message: 'Maximum 10 étiquettes, chacune entre 2 et 20 caractères'
        }
    },
    sousTaches: {
        type: [subtaskSchema],
        validate: {
            validator: function(arr) {
                return arr.length <= 20;
            },
            message: 'Maximum 20 sous-tâches par tâche'
        }
    },
    commentaires: {
        type: [commentaireSchema],
        validate: {
            validator: function(arr) {
                return arr.length <= 50;
            },
            message: 'Maximum 50 commentaires par tâche'
        }
    },
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
    historique: [historiqueSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Task must belong to a user']
    },
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

// Virtual field: task completion percentage
taskSchema.virtual('progression').get(function() {
    if (!this.sousTaches || this.sousTaches.length === 0) {
        return this.statut === 'terminée' ? 100 : 0;
    }
    const completed = this.sousTaches.filter(st => st.statut === 'terminée').length;
    return Math.round((completed / this.sousTaches.length) * 100);
});

// Virtual field: is overdue
taskSchema.virtual('enRetard').get(function() {
    if (!this.echeance) return false;
    return this.echeance < new Date() && this.statut !== 'terminée';
});

// Middleware: Add creation to history
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

// Create indexes for better performance
taskSchema.index({ statut: 1, priorite: -1 });
taskSchema.index({ echeance: 1 });
taskSchema.index({ categorie: 1 });
taskSchema.index({ 'auteur.email': 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ deleted: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;