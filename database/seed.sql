USE goeats_food;

INSERT INTO `categories` (category_id, name, display_order) VALUES
(1, 'Main Course', 1),
(2, 'Starters', 2),
(3, 'Beverages', 3),
(4, 'Desserts', 4),
(5, 'Essentials', 5)
ON DUPLICATE KEY UPDATE name = VALUES(name), display_order = VALUES(display_order);

INSERT INTO `suppliers` (supplier_id, name, contact, email) VALUES
(1, 'FreshFarm Foods', '9876543210', 'orders@freshfarm.example'),
(2, 'DairyNest Co.', '9876501122', 'sales@dairynest.example'),
(3, 'BeverageHub', '9876502244', 'contact@beveragehub.example')
ON DUPLICATE KEY UPDATE name = VALUES(name), contact = VALUES(contact), email = VALUES(email);

INSERT INTO `staff` (staff_id, name, role, phone) VALUES
(1, 'Aarav Shah', 'admin', '9000000001'),
(2, 'Neha Patel', 'waiter', '9000000002'),
(3, 'Rohit Mehta', 'waiter', '9000000003'),
(4, 'Isha Khan', 'cashier', '9000000004'),
(5, 'Vikram Rao', 'kitchen', '9000000005')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), phone = VALUES(phone);

INSERT INTO `tables` (table_id, capacity, location, status) VALUES
(1, 2, 'A1', 'occupied'),
(2, 2, 'A2', 'occupied'),
(3, 4, 'A3', 'occupied'),
(4, 4, 'A4', 'occupied'),
(5, 6, 'A5', 'available'),
(6, 2, 'B1', 'reserved'),
(7, 4, 'B2', 'available'),
(8, 4, 'B3', 'available'),
(9, 6, 'B4', 'available'),
(10, 2, 'B5', 'reserved'),
(11, 2, 'C1', 'available'),
(12, 4, 'C2', 'available'),
(13, 4, 'C3', 'available'),
(14, 6, 'C4', 'available'),
(15, 8, 'C5', 'available')
ON DUPLICATE KEY UPDATE capacity = VALUES(capacity), location = VALUES(location), status = VALUES(status);

INSERT INTO `menu_items` (item_id, name, category, price, is_available, description, image_url) VALUES
(1, 'Margherita Pizza', 'Main Course', 249.00, TRUE, 'Classic pizza with tomato and cheese.', NULL),
(2, 'Paneer Tikka', 'Starters', 199.00, TRUE, 'Chargrilled paneer with spices.', NULL),
(3, 'Chicken Burger', 'Main Course', 219.00, TRUE, 'Juicy chicken burger with fresh lettuce.', NULL),
(4, 'Veg Fried Rice', 'Main Course', 179.00, TRUE, 'Wok tossed rice with vegetables.', NULL),
(5, 'Butter Chicken', 'Main Course', 329.00, TRUE, 'Creamy butter chicken with rich gravy.', NULL),
(6, 'Caesar Salad', 'Starters', 169.00, TRUE, 'Fresh greens with cheese dressing.', NULL),
(7, 'Masala Dosa', 'Main Course', 159.00, TRUE, 'Crispy dosa with potato masala.', NULL),
(8, 'Cold Coffee', 'Beverages', 129.00, TRUE, 'Chilled coffee blend.', NULL),
(9, 'Lemon Soda', 'Beverages', 99.00, TRUE, 'Refreshing lemon fizz.', NULL),
(10, 'Chocolate Brownie', 'Desserts', 149.00, TRUE, 'Warm brownie with chocolate notes.', NULL),
(11, 'Tiramisu', 'Desserts', 189.00, TRUE, 'Coffee soaked layered dessert.', NULL),
(12, 'French Fries', 'Starters', 119.00, TRUE, 'Golden fries with seasoning.', NULL),
(13, 'Veg Wrap', 'Main Course', 189.00, TRUE, 'Whole wheat wrap with greens.', NULL),
(14, 'Grilled Fish', 'Main Course', 349.00, TRUE, 'Herb grilled fish fillet.', NULL),
(15, 'Chicken Nuggets', 'Starters', 179.00, TRUE, 'Crunchy chicken bites.', NULL),
(16, 'Pasta Alfredo', 'Main Course', 279.00, TRUE, 'Creamy Alfredo pasta.', NULL),
(17, 'Mango Lassi', 'Beverages', 109.00, TRUE, 'Sweet mango yogurt drink.', NULL),
(18, 'Iced Tea', 'Beverages', 89.00, TRUE, 'House brewed iced tea.', NULL),
(19, 'Gulab Jamun', 'Desserts', 99.00, TRUE, 'Indian syrup dessert.', NULL),
(20, 'Veg Sandwich', 'Starters', 129.00, TRUE, 'Fresh vegetable sandwich.', NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), price = VALUES(price), is_available = VALUES(is_available), description = VALUES(description), image_url = VALUES(image_url);

INSERT INTO `inventory` (inventory_id, name, category, quantity, unit, min_threshold, cost_per_unit, supplier_id, last_restocked) VALUES
(1, 'Tomatoes', 'Vegetables', 84, 'kg', 20, 42.00, 1, NOW() - INTERVAL 1 DAY),
(2, 'Mozzarella Cheese', 'Dairy', 56, 'kg', 15, 210.00, 2, NOW() - INTERVAL 2 DAY),
(3, 'Flour', 'Grains', 120, 'kg', 30, 38.00, 1, NOW() - INTERVAL 3 DAY),
(4, 'Chicken Breast', 'Non-Veg', 48, 'kg', 18, 260.00, 1, NOW() - INTERVAL 2 DAY),
(5, 'Lettuce', 'Vegetables', 35, 'kg', 12, 60.00, 1, NOW() - INTERVAL 1 DAY),
(6, 'Rice', 'Grains', 110, 'kg', 25, 55.00, 1, NOW() - INTERVAL 4 DAY),
(7, 'Potatoes', 'Vegetables', 14, 'kg', 20, 36.00, 1, NOW() - INTERVAL 3 DAY),
(8, 'Milk', 'Dairy', 92, 'litre', 20, 48.00, 2, NOW() - INTERVAL 1 DAY),
(9, 'Coffee Beans', 'Beverages', 22, 'kg', 10, 320.00, 3, NOW() - INTERVAL 5 DAY),
(10, 'Soft Drink Syrup', 'Beverages', 28, 'litre', 10, 140.00, 3, NOW() - INTERVAL 5 DAY),
(11, 'Fish Fillet', 'Non-Veg', 24, 'kg', 10, 340.00, 1, NOW() - INTERVAL 2 DAY),
(12, 'Mango Pulp', 'Beverages', 16, 'litre', 8, 180.00, 3, NOW() - INTERVAL 2 DAY)
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), quantity = VALUES(quantity), unit = VALUES(unit), min_threshold = VALUES(min_threshold), cost_per_unit = VALUES(cost_per_unit), supplier_id = VALUES(supplier_id), last_restocked = VALUES(last_restocked);

INSERT INTO `recipes` (recipe_id, item_id, inventory_id, qty_used, unit) VALUES
(1, 1, 3, 0.40, 'kg'), (2, 1, 1, 0.15, 'kg'), (3, 1, 2, 0.12, 'kg'),
(4, 2, 2, 0.18, 'kg'), (5, 2, 1, 0.08, 'kg'),
(6, 3, 4, 0.20, 'kg'), (7, 3, 3, 0.10, 'kg'), (8, 3, 5, 0.04, 'kg'),
(9, 4, 6, 0.25, 'kg'), (10, 4, 1, 0.08, 'kg'),
(11, 5, 4, 0.22, 'kg'), (12, 5, 1, 0.12, 'kg'), (13, 5, 8, 0.10, 'litre'),
(14, 6, 5, 0.10, 'kg'), (15, 6, 1, 0.06, 'kg'), (16, 6, 2, 0.05, 'kg'),
(17, 7, 3, 0.18, 'kg'), (18, 7, 1, 0.06, 'kg'),
(19, 8, 8, 0.18, 'litre'), (20, 8, 9, 0.03, 'kg'),
(21, 9, 10, 0.12, 'litre'),
(22, 10, 3, 0.12, 'kg'), (23, 10, 8, 0.08, 'litre'),
(24, 11, 8, 0.10, 'litre'), (25, 11, 9, 0.02, 'kg'),
(26, 12, 7, 0.18, 'kg'),
(27, 13, 3, 0.12, 'kg'), (28, 13, 5, 0.05, 'kg'), (29, 13, 1, 0.05, 'kg'),
(30, 14, 11, 0.22, 'kg'), (31, 14, 1, 0.04, 'kg'),
(32, 15, 4, 0.18, 'kg'), (33, 15, 3, 0.06, 'kg'),
(34, 16, 3, 0.14, 'kg'), (35, 16, 8, 0.10, 'litre'), (36, 16, 2, 0.06, 'kg'),
(37, 17, 8, 0.16, 'litre'), (38, 17, 12, 0.07, 'litre'),
(39, 18, 10, 0.10, 'litre'),
(40, 19, 8, 0.12, 'litre'), (41, 19, 3, 0.04, 'kg'),
(42, 20, 5, 0.06, 'kg'), (43, 20, 1, 0.04, 'kg'), (44, 20, 2, 0.03, 'kg')
ON DUPLICATE KEY UPDATE item_id = VALUES(item_id), inventory_id = VALUES(inventory_id), qty_used = VALUES(qty_used), unit = VALUES(unit);

INSERT INTO `reservations` (reservation_id, table_id, customer_name, party_size, reserved_at, status) VALUES
(1, 6, 'Arjun Verma', 4, NOW() + INTERVAL 2 HOUR, 'reserved'),
(2, 10, 'Meera Iyer', 2, NOW() + INTERVAL 3 HOUR, 'reserved')
ON DUPLICATE KEY UPDATE customer_name = VALUES(customer_name), party_size = VALUES(party_size), reserved_at = VALUES(reserved_at), status = VALUES(status);

INSERT INTO `orders` (order_id, table_id, staff_id, status, created_at, updated_at, notes) VALUES
(1, 1, 2, 'pending', NOW() - INTERVAL 75 MINUTE, NOW() - INTERVAL 75 MINUTE, 'No onions'),
(2, 2, 2, 'cooking', NOW() - INTERVAL 58 MINUTE, NOW() - INTERVAL 45 MINUTE, 'Extra spicy'),
(3, 3, 3, 'ready', NOW() - INTERVAL 42 MINUTE, NOW() - INTERVAL 12 MINUTE, 'Kids meal split'),
(4, 4, 3, 'served', NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 8 MINUTE, 'Table merge request'),
(5, 5, 2, 'billed', NOW() - INTERVAL 18 MINUTE, NOW() - INTERVAL 2 MINUTE, 'Paid by card')
ON DUPLICATE KEY UPDATE table_id = VALUES(table_id), staff_id = VALUES(staff_id), status = VALUES(status), created_at = VALUES(created_at), updated_at = VALUES(updated_at), notes = VALUES(notes);

INSERT INTO `order_items` (order_item_id, order_id, item_id, quantity, unit_price, special_notes) VALUES
(1, 1, 1, 2, 249.00, 'Light cheese'),
(2, 1, 12, 1, 119.00, NULL),
(3, 2, 3, 1, 219.00, 'No mayo'),
(4, 2, 9, 2, 99.00, 'Less sugar'),
(5, 3, 4, 2, 179.00, NULL),
(6, 3, 20, 1, 129.00, 'Toasted'),
(7, 4, 5, 1, 329.00, NULL),
(8, 4, 8, 2, 129.00, 'No ice'),
(9, 5, 7, 1, 159.00, NULL),
(10, 5, 10, 1, 149.00, NULL),
(11, 5, 17, 2, 109.00, 'Less sweet')
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), unit_price = VALUES(unit_price), special_notes = VALUES(special_notes);

INSERT INTO `bills` (bill_id, order_id, subtotal, tax_amount, service_charge, total, payment_mode, billed_at, staff_id) VALUES
(1, 5, 526.00, 26.30, 10.52, 562.82, 'Card', NOW() - INTERVAL 2 MINUTE, 4)
ON DUPLICATE KEY UPDATE subtotal = VALUES(subtotal), tax_amount = VALUES(tax_amount), service_charge = VALUES(service_charge), total = VALUES(total), payment_mode = VALUES(payment_mode), billed_at = VALUES(billed_at), staff_id = VALUES(staff_id);

INSERT INTO `inventory_log` (log_id, inventory_id, change_amount, change_type, changed_at, staff_id) VALUES
(1, 7, -6.00, 'deduction', NOW() - INTERVAL 1 HOUR, 5),
(2, 8, 20.00, 'restock', NOW() - INTERVAL 5 HOUR, 1),
(3, 2, -4.00, 'deduction', NOW() - INTERVAL 3 HOUR, 5)
ON DUPLICATE KEY UPDATE change_amount = VALUES(change_amount), change_type = VALUES(change_type), changed_at = VALUES(changed_at), staff_id = VALUES(staff_id);
