CREATE DATABASE IF NOT EXISTS goeats_food;
USE goeats_food;

CREATE TABLE IF NOT EXISTS `staff` (
  staff_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role ENUM('admin','waiter','cashier','kitchen') NOT NULL,
  phone VARCHAR(30),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `tables` (
  table_id INT AUTO_INCREMENT PRIMARY KEY,
  capacity INT NOT NULL,
  location VARCHAR(120),
  status ENUM('available','occupied','reserved') NOT NULL DEFAULT 'available'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `reservations` (
  reservation_id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  party_size INT NOT NULL,
  reserved_at DATETIME NOT NULL,
  status ENUM('reserved','seated','cancelled','completed') NOT NULL DEFAULT 'reserved',
  CONSTRAINT fk_reservations_table FOREIGN KEY (table_id) REFERENCES `tables` (table_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `categories` (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `menu_items` (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(120) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  image_url VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `orders` (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT NOT NULL,
  staff_id INT NOT NULL,
  status ENUM('pending','cooking','ready','served','billed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  notes TEXT,
  CONSTRAINT fk_orders_table FOREIGN KEY (table_id) REFERENCES `tables` (table_id),
  CONSTRAINT fk_orders_staff FOREIGN KEY (staff_id) REFERENCES `staff` (staff_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `order_items` (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  special_notes TEXT,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES `orders` (order_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_menu_item FOREIGN KEY (item_id) REFERENCES `menu_items` (item_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bills` (
  bill_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  service_charge DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_mode ENUM('Cash','UPI','Card','Split') NOT NULL,
  billed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  staff_id INT NOT NULL,
  CONSTRAINT fk_bills_order FOREIGN KEY (order_id) REFERENCES `orders` (order_id) ON DELETE CASCADE,
  CONSTRAINT fk_bills_staff FOREIGN KEY (staff_id) REFERENCES `staff` (staff_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `suppliers` (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  contact VARCHAR(60),
  email VARCHAR(160)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `inventory` (
  inventory_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(120) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(30) NOT NULL,
  min_threshold DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,2) NOT NULL,
  supplier_id INT,
  last_restocked DATETIME,
  CONSTRAINT fk_inventory_supplier FOREIGN KEY (supplier_id) REFERENCES `suppliers` (supplier_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `recipes` (
  recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  inventory_id INT NOT NULL,
  qty_used DECIMAL(10,2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  CONSTRAINT fk_recipes_menu_item FOREIGN KEY (item_id) REFERENCES `menu_items` (item_id) ON DELETE CASCADE,
  CONSTRAINT fk_recipes_inventory FOREIGN KEY (inventory_id) REFERENCES `inventory` (inventory_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `inventory_log` (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_id INT NOT NULL,
  change_amount DECIMAL(10,2) NOT NULL,
  change_type ENUM('deduction','restock') NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  staff_id INT NOT NULL,
  CONSTRAINT fk_inventory_log_inventory FOREIGN KEY (inventory_id) REFERENCES `inventory` (inventory_id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_log_staff FOREIGN KEY (staff_id) REFERENCES `staff` (staff_id)
) ENGINE=InnoDB;

CREATE INDEX idx_orders_status ON `orders` (status);
CREATE INDEX idx_orders_table_id ON `orders` (table_id);
CREATE INDEX idx_orders_created_at ON `orders` (created_at);
CREATE INDEX idx_bills_billed_at ON `bills` (billed_at);
