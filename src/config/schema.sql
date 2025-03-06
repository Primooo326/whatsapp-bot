-- Crear tabla users
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla bots
DROP TABLE IF EXISTS bots;

CREATE TABLE bots (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('activo', 'inactivo') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Crear tabla services
DROP TABLE IF EXISTS services;

CREATE TABLE services (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  bot_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category ENUM(
    'Servicio de mensajes masivos',
    'Servicio de flujos de conversación',
    'Servicio de prompts con IA'
  ) NOT NULL,
  description TEXT,
  scheduled_date TEXT,
  scheduled_type ENUM('programado', 'unaVez') NOT NULL,
  status ENUM(
    'programado',
    'ejecutado',
    'con alertas',
    'fallido'
  ) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bot_id) REFERENCES bots (id) ON DELETE CASCADE
);

-- Crear tabla channels
DROP TABLE IF EXISTS channels;

CREATE TABLE channels (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  channel_type ENUM('correo', 'telefono') NOT NULL,
  channel_account VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla contacts
DROP TABLE IF EXISTS contacts;

CREATE TABLE contacts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255),
  channel_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE
);

-- Crear tabla contact_groups
DROP TABLE IF EXISTS contact_groups;

CREATE TABLE contact_groups (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  bot_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bot_id) REFERENCES bots (id) ON DELETE CASCADE
);

-- Crear tabla contact_group_members
DROP TABLE IF EXISTS contact_group_members;

CREATE TABLE contact_group_members (
  group_id CHAR(36) NOT NULL,
  contact_id CHAR(36) NOT NULL,
  PRIMARY KEY (group_id, contact_id),
  FOREIGN KEY (group_id) REFERENCES contact_groups (id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
);

-- Crear tabla service_executions
DROP TABLE IF EXISTS service_executions;

CREATE TABLE service_executions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  service_id CHAR(36) NOT NULL,
  contact_id CHAR(36),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('leido', 'enviado', 'no encontrado') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
);

-- Crear tabla service_contents
DROP TABLE IF EXISTS service_contents;

CREATE TABLE service_contents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  service_id CHAR(36) NOT NULL,
  message_body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
);

-- Crear tabla attachments
DROP TABLE IF EXISTS attachments;

CREATE TABLE attachments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  service_content_id CHAR(36) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_content_id) REFERENCES service_contents (id) ON DELETE CASCADE
);