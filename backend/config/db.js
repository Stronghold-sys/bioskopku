const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const generateObjectId = () => {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
};

const addVirtualId = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(addVirtualId);
  }
  if (obj._id && obj.id === undefined) {
    obj.id = obj._id;
  }
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      addVirtualId(obj[key]);
    }
  }
  return obj;
};

// Global registry of all registered models to facilitate populate lookup
const activeModels = {};

// Check if Supabase credentials are valid (and not placeholders)
const isSupabaseConfigured = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  return url && url.startsWith('https://') && !url.includes('your-project-id') &&
         key && key.length > 20 && !key.includes('your-anon-key-here');
};

let supabase = null;
if (isSupabaseConfigured()) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log('📡 Supabase Client Initialized.');
  } catch (err) {
    console.error('❌ Supabase initialization failed:', err.message);
  }
}

// -------------------------------------------------------------
// Supabase Query & Model implementation
// -------------------------------------------------------------

class SupabaseQuery {
  constructor(readPromise, model, singleResult = false, query = {}) {
    this.readPromise = readPromise;
    this.model = model;
    this._singleResult = singleResult;
    this._query = query;
    this._populatePaths = [];
    this._sortRules = null;
    this._limit = null;
    this._skip = null;
  }

  populate(pathName) {
    this._populatePaths.push(pathName);
    return this;
  }

  sort(rules) {
    this._sortRules = rules;
    return this;
  }

  limit(num) {
    this._limit = num;
    return this;
  }

  skip(num) {
    this._skip = num;
    return this;
  }

  async exec() {
    const rawData = await this.readPromise;
    let result = JSON.parse(JSON.stringify(rawData));

    // Apply MongoDB-like filter rules on in-memory items
    result = result.filter(item => {
      for (const key in this._query) {
        const queryVal = this._query[key];
        if (queryVal && typeof queryVal === 'object' && !Array.isArray(queryVal)) {
          if ('$in' in queryVal) {
            const arr = queryVal.$in;
            const itemVal = item[key];
            if (Array.isArray(itemVal)) {
              if (!itemVal.some(v => arr.includes(v))) return false;
            } else {
              if (!arr.includes(itemVal)) return false;
            }
          } else if ('$gte' in queryVal) {
            if (item[key] < queryVal.$gte) return false;
          } else if ('$lte' in queryVal) {
            if (item[key] > queryVal.$lte) return false;
          } else if ('$gt' in queryVal) {
            if (item[key] <= queryVal.$gt) return false;
          } else if ('$lt' in queryVal) {
            if (item[key] >= queryVal.$lt) return false;
          } else if ('$ne' in queryVal) {
            if (item[key] === queryVal.$ne) return false;
          }
        } else {
          if (item[key] !== queryVal) return false;
        }
      }
      return true;
    });

    // Handle sort
    if (this._sortRules) {
      let key = '';
      let order = 1;
      if (typeof this._sortRules === 'object') {
        key = Object.keys(this._sortRules)[0];
        order = this._sortRules[key];
      } else if (typeof this._sortRules === 'string') {
        if (this._sortRules.startsWith('-')) {
          key = this._sortRules.substring(1);
          order = -1;
        } else {
          key = this._sortRules;
          order = 1;
        }
      }
      if (key) {
        result.sort((a, b) => {
          let valA = a[key];
          let valB = b[key];
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA < valB) return order === -1 ? 1 : -1;
          if (valA > valB) return order === -1 ? -1 : 1;
          return 0;
        });
      }
    }

    // Handle skip
    if (this._skip !== null && this._skip !== undefined) {
      result = result.slice(this._skip);
    }

    // Handle limit
    if (this._limit !== null && this._limit !== undefined) {
      result = result.slice(0, this._limit);
    }

    // Handle populate relationships
    for (const p of this._populatePaths) {
      let pathName = p;
      let nestedPopulate = null;
      if (typeof p === 'object') {
        pathName = p.path;
        nestedPopulate = p.populate;
      }

      const schemaField = this.model.schema[pathName];
      let refModelName = null;
      if (Array.isArray(schemaField) && schemaField[0] && schemaField[0].ref) {
        refModelName = schemaField[0].ref;
      } else if (schemaField && schemaField.ref) {
        refModelName = schemaField.ref;
      } else if (schemaField && typeof schemaField === 'object' && schemaField.type && schemaField.type.ref) {
        refModelName = schemaField.type.ref;
      }

      if (refModelName) {
        const refWrapper = activeModels[refModelName];
        if (refWrapper) {
          const refModelInstance = refWrapper.getModel();
          const refData = await refModelInstance.find().exec();
          result = await Promise.all(result.map(async (item) => {
            const val = item[pathName];
            if (Array.isArray(val)) {
              item[pathName] = val.map(id => refData.find(r => r._id === id || (id && id._id === r._id)) || id);
            } else if (val) {
              const targetId = typeof val === 'object' && val._id ? val._id : val;
              let found = refData.find(r => r._id === targetId);
              if (found && nestedPopulate) {
                const nestedArr = Array.isArray(nestedPopulate) ? nestedPopulate : [nestedPopulate];
                for (const n of nestedArr) {
                  let nPath = typeof n === 'object' ? n.path : n;
                  let nSubPopulate = typeof n === 'object' ? n.populate : null;
                  const refModelSchema = refWrapper.schema;
                  const nRefField = refModelSchema[nPath];
                  let nRefModelName = null;
                  if (Array.isArray(nRefField) && nRefField[0] && nRefField[0].ref) {
                    nRefModelName = nRefField[0].ref;
                  } else if (nRefField && nRefField.ref) {
                    nRefModelName = nRefField.ref;
                  } else if (nRefField && typeof nRefField === 'object' && nRefField.type && nRefField.type.ref) {
                    nRefModelName = nRefField.type.ref;
                  }

                  if (nRefModelName) {
                    const nRefWrapper = activeModels[nRefModelName];
                    if (nRefWrapper) {
                      const nRefInstance = nRefWrapper.getModel();
                      const nRefData = await nRefInstance.find().exec();
                      const targetNId = typeof found[nPath] === 'object' && found[nPath]._id ? found[nPath]._id : found[nPath];
                      let nFound = nRefData.find(r => r._id === targetNId);
                      if (nFound && nSubPopulate) {
                        // Support double nested populate if needed
                        const nSubArr = Array.isArray(nSubPopulate) ? nSubPopulate : [nSubPopulate];
                        for (const subN of nSubArr) {
                          let subPath = typeof subN === 'object' ? subN.path : subN;
                          const subRefField = nRefWrapper.schema[subPath];
                          let subRefModelName = subRefField?.ref || subRefField?.type?.ref;
                          if (subRefModelName) {
                            const subRefWrapper = activeModels[subRefModelName];
                            if (subRefWrapper) {
                              const subRefInstance = subRefWrapper.getModel();
                              const subRefData = await subRefInstance.find().exec();
                              const targetSubId = typeof nFound[subPath] === 'object' && nFound[subPath]._id ? nFound[subPath]._id : nFound[subPath];
                              nFound[subPath] = subRefData.find(r => r._id === targetSubId) || nFound[subPath];
                            }
                          }
                        }
                      }
                      found[nPath] = nFound || found[nPath];
                    }
                  }
                }
              }
              item[pathName] = found || val;
            }
            return item;
          }));
        }
      }
    }
    
    result = addVirtualId(result);
    return this._singleResult ? (result[0] || null) : result;
  }

  then(onfulfilled, onrejected) {
    return this.exec().then(onfulfilled, onrejected);
  }
}

class SupabaseModel {
  constructor(modelName, schema) {
    this.modelName = modelName;
    this.schema = schema;
    this.tableName = modelName + 's';
  }

  async read() {
    const { data, error } = await supabase.from(this.tableName).select('*');
    if (error) {
      console.error(`❌ Error reading from Supabase table ${this.tableName}:`, error.message);
      return [];
    }
    return data || [];
  }

  find(query = {}) {
    return new SupabaseQuery(this.read(), this, false, query);
  }

  findOne(query = {}) {
    return new SupabaseQuery(this.read(), this, true, query);
  }

  findById(id) {
    return new SupabaseQuery(this.read(), this, true, { _id: id });
  }

  async create(doc) {
    if (Array.isArray(doc)) {
      const newDocs = doc.map(d => ({
        _id: d._id || generateObjectId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...d
      }));
      const { error } = await supabase.from(this.tableName).insert(newDocs);
      if (error) {
        console.error(`❌ Error inserting bulk into Supabase table ${this.tableName}:`, error.message);
        throw new Error(error.message);
      }
      return addVirtualId(newDocs);
    }
    const newDoc = {
      _id: doc._id || generateObjectId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    const { error } = await supabase.from(this.tableName).insert(newDoc);
    if (error) {
      console.error(`❌ Error inserting into Supabase table ${this.tableName}:`, error.message);
      throw new Error(error.message);
    }
    return addVirtualId(newDoc);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const current = await this.findById(id).exec();
    if (!current) return null;

    const updateData = update.$set || update;
    const updatedDoc = {
      ...current,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Clean up relation properties (convert populated objects back to IDs)
    const docToSave = { ...updatedDoc };
    // Remove virtual `id` field added by addVirtualId - Supabase has no `id` column
    delete docToSave.id;
    for (const key in this.schema) {
      if (this.schema[key].ref && docToSave[key] && typeof docToSave[key] === 'object') {
        docToSave[key] = docToSave[key]._id || docToSave[key];
      }
    }

    const { error } = await supabase.from(this.tableName).update(docToSave).eq('_id', id);
    if (error) {
      console.error(`❌ Error updating Supabase table ${this.tableName}:`, error.message);
      throw new Error(error.message);
    }
    return addVirtualId(updatedDoc);
  }

  async findByIdAndDelete(id) {
    const current = await this.findById(id).exec();
    if (!current) return null;

    const { error } = await supabase.from(this.tableName).delete().eq('_id', id);
    if (error) {
      console.error(`❌ Error deleting from Supabase table ${this.tableName}:`, error.message);
      throw new Error(error.message);
    }
    return addVirtualId(current);
  }

  async countDocuments(query = {}) {
    const data = await this.find(query).exec();
    return data.length;
  }
}

// -------------------------------------------------------------
// Local Mock JSON implementation (original fallback logic)
// -------------------------------------------------------------

class MockQuery {
  constructor(data, model, singleResult = false) {
    this.data = JSON.parse(JSON.stringify(data));
    this.model = model;
    this._singleResult = singleResult;
    this._populatePaths = [];
    this._sortRules = null;
    this._limit = null;
    this._skip = null;
  }

  populate(pathName) {
    this._populatePaths.push(pathName);
    return this;
  }

  sort(rules) {
    this._sortRules = rules;
    return this;
  }

  limit(num) {
    this._limit = num;
    return this;
  }

  skip(num) {
    this._skip = num;
    return this;
  }

  async exec() {
    let result = [...this.data];

    // Handle sort
    if (this._sortRules) {
      let key = '';
      let order = 1;
      if (typeof this._sortRules === 'object') {
        key = Object.keys(this._sortRules)[0];
        order = this._sortRules[key];
      } else if (typeof this._sortRules === 'string') {
        if (this._sortRules.startsWith('-')) {
          key = this._sortRules.substring(1);
          order = -1;
        } else {
          key = this._sortRules;
          order = 1;
        }
      }
      if (key) {
        result.sort((a, b) => {
          let valA = a[key];
          let valB = b[key];
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA < valB) return order === -1 ? 1 : -1;
          if (valA > valB) return order === -1 ? -1 : 1;
          return 0;
        });
      }
    }

    // Handle skip
    if (this._skip !== null && this._skip !== undefined) {
      result = result.slice(this._skip);
    }

    // Handle limit
    if (this._limit !== null && this._limit !== undefined) {
      result = result.slice(0, this._limit);
    }

    // Handle populate (using activeModels registry)
    for (const p of this._populatePaths) {
      let pathName = p;
      let nestedPopulate = null;
      if (typeof p === 'object') {
        pathName = p.path;
        nestedPopulate = p.populate;
      }

      const schemaField = this.model.schema[pathName];
      let refModelName = null;
      if (Array.isArray(schemaField) && schemaField[0] && schemaField[0].ref) {
        refModelName = schemaField[0].ref;
      } else if (schemaField && schemaField.ref) {
        refModelName = schemaField.ref;
      } else if (schemaField && typeof schemaField === 'object' && schemaField.type && schemaField.type.ref) {
        refModelName = schemaField.type.ref;
      }

      if (refModelName) {
        const refWrapper = activeModels[refModelName];
        if (refWrapper) {
          const refModelInstance = refWrapper.getModel();
          const refData = refModelInstance.read();
          result = result.map(item => {
            const val = item[pathName];
            if (Array.isArray(val)) {
              item[pathName] = val.map(id => refData.find(r => r._id === id || (id && id._id === r._id)) || id);
            } else if (val) {
              const targetId = typeof val === 'object' && val._id ? val._id : val;
              let found = refData.find(r => r._id === targetId);
              if (found && nestedPopulate) {
                const nestedArr = Array.isArray(nestedPopulate) ? nestedPopulate : [nestedPopulate];
                for (const n of nestedArr) {
                  let nPath = typeof n === 'object' ? n.path : n;
                  const nRefModelName = refWrapper.schema[nPath]?.ref || refWrapper.schema[nPath]?.type?.ref;
                  if (nRefModelName && activeModels[nRefModelName]) {
                    const nRefData = activeModels[nRefModelName].getModel().read();
                    const targetNId = typeof found[nPath] === 'object' && found[nPath]._id ? found[nPath]._id : found[nPath];
                    found[nPath] = nRefData.find(r => r._id === targetNId) || found[nPath];
                  }
                }
              }
              item[pathName] = found || val;
            }
            return item;
          });
        }
      }
    }

    return this._singleResult ? (result[0] || null) : result;
  }

  then(onfulfilled, onrejected) {
    return this.exec().then(onfulfilled, onrejected);
  }
}

class MockModel {
  constructor(modelName, schema) {
    this.modelName = modelName;
    this.schema = schema;
    this.filePath = path.join(__dirname, '..', 'data', `${modelName.toLowerCase()}s.json`);
    this.ensureFileExists();
  }

  ensureFileExists() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  find(query = {}) {
    const data = this.read();
    const filtered = data.filter(item => {
      for (const key in query) {
        if (query[key] && typeof query[key] === 'object' && !Array.isArray(query[key])) {
          if ('$in' in query[key]) {
            if (!query[key].$in.includes(item[key])) return false;
          } else if ('$gte' in query[key]) {
            if (item[key] < query[key].$gte) return false;
          } else if ('$lte' in query[key]) {
            if (item[key] > query[key].$lte) return false;
          }
        } else {
          if (item[key] !== query[key]) return false;
        }
      }
      return true;
    });
    return new MockQuery(filtered, this, false);
  }

  findOne(query = {}) {
    const data = this.read();
    const matches = data.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    return new MockQuery(matches, this, true);
  }

  findById(id) {
    const data = this.read();
    const matches = data.filter(item => item._id === id);
    return new MockQuery(matches, this, true);
  }

  async create(doc) {
    const data = this.read();
    const newDoc = {
      _id: generateObjectId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    data.push(newDoc);
    this.write(data);
    return JSON.parse(JSON.stringify(newDoc));
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const data = this.read();
    const idx = data.findIndex(item => item._id === id);
    if (idx === -1) return null;

    const current = data[idx];
    const updatedDoc = {
      ...current,
      ...(update.$set || update),
      updatedAt: new Date().toISOString()
    };
    data[idx] = updatedDoc;
    this.write(data);
    return JSON.parse(JSON.stringify(updatedDoc));
  }

  async findByIdAndDelete(id) {
    const data = this.read();
    const idx = data.findIndex(item => item._id === id);
    if (idx === -1) return null;
    const deleted = data.splice(idx, 1)[0];
    this.write(data);
    return JSON.parse(JSON.stringify(deleted));
  }

  async countDocuments(query = {}) {
    const data = this.read();
    const filtered = data.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    return filtered.length;
  }
}

// -------------------------------------------------------------
// Database connection and Wrapper factory
// -------------------------------------------------------------

const connectDB = async () => {
  if (isSupabaseConfigured()) {
    console.log('📡 Supabase Connected Successfully.');
    return true;
  }

  if (!process.env.MONGODB_URI) {
    console.log('⚠️  Database credentials not found. Starting in Local Mock JSON Mode.');
    return true;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.log('⚠️ Falling back to Local Mock JSON Mode...');
    process.env.MONGODB_URI = '';
    return true;
  }
};

const dbModel = (name, schema) => {
  if (activeModels[name]) {
    return activeModels[name];
  }

  const wrapper = {
    name,
    schema,
    modelName: name,
    _mongooseModel: null,
    _mockModel: null,
    _supabaseModel: null,
    getModel() {
      if (isSupabaseConfigured()) {
        if (!this._supabaseModel) {
          this._supabaseModel = new SupabaseModel(this.name, this.schema);
        }
        return this._supabaseModel;
      } else if (!process.env.MONGODB_URI) {
        if (!this._mockModel) {
          this._mockModel = new MockModel(this.name, this.schema);
        }
        return this._mockModel;
      } else {
        if (!this._mongooseModel) {
          try {
            this._mongooseModel = mongoose.model(this.name);
          } catch (e) {
            this._mongooseModel = mongoose.model(this.name, new mongoose.Schema(this.schema, { timestamps: true }));
          }
        }
        return this._mongooseModel;
      }
    }
  };

  activeModels[name] = wrapper;

  return new Proxy(wrapper, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      const model = target.getModel();
      const val = model[prop];
      if (typeof val === 'function') {
        return val.bind(model);
      }
      return val;
    }
  });
};

module.exports = {
  connectDB,
  isMockMode: () => !isSupabaseConfigured() && !process.env.MONGODB_URI,
  isSupabaseMode: () => isSupabaseConfigured(),
  dbModel,
  generateObjectId
};
