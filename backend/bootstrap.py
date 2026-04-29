from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func

from models import Bill, Category, DiningTable, Inventory, InventoryLog, MenuItem, Order, OrderItem, Recipe, Reservation, Staff, Supplier


def seed_sample_data(session):
    if session.query(Staff).first():
        return

    categories = [
        Category(category_id=1, name="Main Course", display_order=1),
        Category(category_id=2, name="Starters", display_order=2),
        Category(category_id=3, name="Beverages", display_order=3),
        Category(category_id=4, name="Desserts", display_order=4),
        Category(category_id=5, name="Essentials", display_order=5),
    ]
    suppliers = [
        Supplier(supplier_id=1, name="FreshFarm Foods", contact="9876543210", email="orders@freshfarm.example"),
        Supplier(supplier_id=2, name="DairyNest Co.", contact="9876501122", email="sales@dairynest.example"),
        Supplier(supplier_id=3, name="BeverageHub", contact="9876502244", email="contact@beveragehub.example"),
    ]
    staff = [
        Staff(staff_id=1, name="Aarav Shah", role="admin", phone="9000000001"),
        Staff(staff_id=2, name="Neha Patel", role="waiter", phone="9000000002"),
        Staff(staff_id=3, name="Rohit Mehta", role="waiter", phone="9000000003"),
        Staff(staff_id=4, name="Isha Khan", role="cashier", phone="9000000004"),
        Staff(staff_id=5, name="Vikram Rao", role="kitchen", phone="9000000005"),
    ]
    tables = [
        DiningTable(table_id=index + 1, capacity=2 if index in {0, 1, 4, 6, 10, 11} else 4 if index in {2, 3, 7, 8, 12} else 6 if index in {5, 9, 13} else 8, location=f"{chr(65 + index // 5)}{(index % 5) + 1}", status="available")
        for index in range(15)
    ]
    tables[0].status = "occupied"
    tables[1].status = "occupied"
    tables[2].status = "occupied"
    tables[3].status = "occupied"
    tables[5].status = "reserved"
    tables[9].status = "reserved"

    menu_items = [
        MenuItem(item_id=1, name="Margherita Pizza", category="Main Course", price=249, is_available=True, description="Classic pizza with tomato and cheese."),
        MenuItem(item_id=2, name="Paneer Tikka", category="Starters", price=199, is_available=True, description="Chargrilled paneer with spices."),
        MenuItem(item_id=3, name="Chicken Burger", category="Main Course", price=219, is_available=True, description="Juicy chicken burger with fresh lettuce."),
        MenuItem(item_id=4, name="Veg Fried Rice", category="Main Course", price=179, is_available=True, description="Wok tossed rice with vegetables."),
        MenuItem(item_id=5, name="Butter Chicken", category="Main Course", price=329, is_available=True, description="Creamy butter chicken with rich gravy."),
        MenuItem(item_id=6, name="Caesar Salad", category="Starters", price=169, is_available=True, description="Fresh greens with cheese dressing."),
        MenuItem(item_id=7, name="Masala Dosa", category="Main Course", price=159, is_available=True, description="Crispy dosa with potato masala."),
        MenuItem(item_id=8, name="Cold Coffee", category="Beverages", price=129, is_available=True, description="Chilled coffee blend."),
        MenuItem(item_id=9, name="Lemon Soda", category="Beverages", price=99, is_available=True, description="Refreshing lemon fizz."),
        MenuItem(item_id=10, name="Chocolate Brownie", category="Desserts", price=149, is_available=True, description="Warm brownie with chocolate notes."),
        MenuItem(item_id=11, name="Tiramisu", category="Desserts", price=189, is_available=True, description="Coffee soaked layered dessert."),
        MenuItem(item_id=12, name="French Fries", category="Starters", price=119, is_available=True, description="Golden fries with seasoning."),
        MenuItem(item_id=13, name="Veg Wrap", category="Main Course", price=189, is_available=True, description="Whole wheat wrap with greens."),
        MenuItem(item_id=14, name="Grilled Fish", category="Main Course", price=349, is_available=True, description="Herb grilled fish fillet."),
        MenuItem(item_id=15, name="Chicken Nuggets", category="Starters", price=179, is_available=True, description="Crunchy chicken bites."),
        MenuItem(item_id=16, name="Pasta Alfredo", category="Main Course", price=279, is_available=True, description="Creamy Alfredo pasta."),
        MenuItem(item_id=17, name="Mango Lassi", category="Beverages", price=109, is_available=True, description="Sweet mango yogurt drink."),
        MenuItem(item_id=18, name="Iced Tea", category="Beverages", price=89, is_available=True, description="House brewed iced tea."),
        MenuItem(item_id=19, name="Gulab Jamun", category="Desserts", price=99, is_available=True, description="Indian syrup dessert."),
        MenuItem(item_id=20, name="Veg Sandwich", category="Starters", price=129, is_available=True, description="Fresh vegetable sandwich."),
    ]
    inventory = [
        Inventory(inventory_id=1, name="Tomatoes", category="Vegetables", quantity=84, unit="kg", min_threshold=20, cost_per_unit=42, supplier_id=1, last_restocked=datetime.utcnow() - timedelta(days=1)),
        Inventory(inventory_id=2, name="Mozzarella Cheese", category="Dairy", quantity=56, unit="kg", min_threshold=15, cost_per_unit=210, supplier_id=2, last_restocked=datetime.utcnow() - timedelta(days=2)),
        Inventory(inventory_id=3, name="Flour", category="Grains", quantity=120, unit="kg", min_threshold=30, cost_per_unit=38, supplier_id=1, last_restocked=datetime.utcnow() - timedelta(days=3)),
        Inventory(inventory_id=4, name="Chicken Breast", category="Non-Veg", quantity=48, unit="kg", min_threshold=18, cost_per_unit=260, supplier_id=1, last_restocked=datetime.utcnow() - timedelta(days=2)),
        Inventory(inventory_id=5, name="Lettuce", category="Vegetables", quantity=35, unit="kg", min_threshold=12, cost_per_unit=60, supplier_id=1, last_restocked=datetime.utcnow() - timedelta(days=1)),
        Inventory(inventory_id=6, name="Rice", category="Grains", quantity=110, unit="kg", min_threshold=25, cost_per_unit=55, supplier_id=1, last_restocked=datetime.utcnow() - timedelta(days=4)),
        Inventory(inventory_id=7, name="Potatoes", category="Vegetables", quantity=14, unit="kg", min_threshold=20, cost_per_unit=36, supplier_id=1, last_restocked=datetime.utcnow() - timedelta(days=3)),
        Inventory(inventory_id=8, name="Milk", category="Dairy", quantity=92, unit="litre", min_threshold=20, cost_per_unit=48, supplier_id=2, last_restocked=datetime.utcnow() - timedelta(days=1)),
        Inventory(inventory_id=9, name="Coffee Beans", category="Beverages", quantity=22, unit="kg", min_threshold=10, cost_per_unit=320, supplier_id=3, last_restocked=datetime.utcnow() - timedelta(days=5)),
        Inventory(inventory_id=10, name="Soft Drink Syrup", category="Beverages", quantity=28, unit="litre", min_threshold=10, cost_per_unit=140, supplier_id=3, last_restocked=datetime.utcnow() - timedelta(days=5)),
        Inventory(inventory_id=11, name="Fish Fillet", category="Non-Veg", quantity=24, unit="kg", min_threshold=10, cost_per_unit=340, supplier_id=1, last_restocked=datetime.utcnow() - timedelta(days=2)),
        Inventory(inventory_id=12, name="Mango Pulp", category="Beverages", quantity=16, unit="litre", min_threshold=8, cost_per_unit=180, supplier_id=3, last_restocked=datetime.utcnow() - timedelta(days=2)),
    ]
    recipes = [
        Recipe(item_id=1, inventory_id=3, qty_used=0.40, unit="kg"), Recipe(item_id=1, inventory_id=1, qty_used=0.15, unit="kg"), Recipe(item_id=1, inventory_id=2, qty_used=0.12, unit="kg"),
        Recipe(item_id=2, inventory_id=2, qty_used=0.18, unit="kg"), Recipe(item_id=2, inventory_id=1, qty_used=0.08, unit="kg"),
        Recipe(item_id=3, inventory_id=4, qty_used=0.20, unit="kg"), Recipe(item_id=3, inventory_id=3, qty_used=0.10, unit="kg"), Recipe(item_id=3, inventory_id=5, qty_used=0.04, unit="kg"),
        Recipe(item_id=4, inventory_id=6, qty_used=0.25, unit="kg"), Recipe(item_id=4, inventory_id=1, qty_used=0.08, unit="kg"),
        Recipe(item_id=5, inventory_id=4, qty_used=0.22, unit="kg"), Recipe(item_id=5, inventory_id=1, qty_used=0.12, unit="kg"), Recipe(item_id=5, inventory_id=8, qty_used=0.10, unit="litre"),
        Recipe(item_id=6, inventory_id=5, qty_used=0.10, unit="kg"), Recipe(item_id=6, inventory_id=1, qty_used=0.06, unit="kg"), Recipe(item_id=6, inventory_id=2, qty_used=0.05, unit="kg"),
        Recipe(item_id=7, inventory_id=3, qty_used=0.18, unit="kg"), Recipe(item_id=7, inventory_id=1, qty_used=0.06, unit="kg"),
        Recipe(item_id=8, inventory_id=8, qty_used=0.18, unit="litre"), Recipe(item_id=8, inventory_id=9, qty_used=0.03, unit="kg"),
        Recipe(item_id=9, inventory_id=10, qty_used=0.12, unit="litre"),
        Recipe(item_id=10, inventory_id=3, qty_used=0.12, unit="kg"), Recipe(item_id=10, inventory_id=8, qty_used=0.08, unit="litre"),
        Recipe(item_id=11, inventory_id=8, qty_used=0.10, unit="litre"), Recipe(item_id=11, inventory_id=9, qty_used=0.02, unit="kg"),
        Recipe(item_id=12, inventory_id=7, qty_used=0.18, unit="kg"),
        Recipe(item_id=13, inventory_id=3, qty_used=0.12, unit="kg"), Recipe(item_id=13, inventory_id=5, qty_used=0.05, unit="kg"), Recipe(item_id=13, inventory_id=1, qty_used=0.05, unit="kg"),
        Recipe(item_id=14, inventory_id=11, qty_used=0.22, unit="kg"), Recipe(item_id=14, inventory_id=1, qty_used=0.04, unit="kg"),
        Recipe(item_id=15, inventory_id=4, qty_used=0.18, unit="kg"), Recipe(item_id=15, inventory_id=3, qty_used=0.06, unit="kg"),
        Recipe(item_id=16, inventory_id=3, qty_used=0.14, unit="kg"), Recipe(item_id=16, inventory_id=8, qty_used=0.10, unit="litre"), Recipe(item_id=16, inventory_id=2, qty_used=0.06, unit="kg"),
        Recipe(item_id=17, inventory_id=8, qty_used=0.16, unit="litre"), Recipe(item_id=17, inventory_id=12, qty_used=0.07, unit="litre"),
        Recipe(item_id=18, inventory_id=10, qty_used=0.10, unit="litre"),
        Recipe(item_id=19, inventory_id=8, qty_used=0.12, unit="litre"), Recipe(item_id=19, inventory_id=3, qty_used=0.04, unit="kg"),
        Recipe(item_id=20, inventory_id=5, qty_used=0.06, unit="kg"), Recipe(item_id=20, inventory_id=1, qty_used=0.04, unit="kg"), Recipe(item_id=20, inventory_id=2, qty_used=0.03, unit="kg"),
    ]

    session.add_all(categories + suppliers + staff + tables + menu_items + inventory + recipes)
    session.flush()

    reservations = [
        Reservation(reservation_id=1, table_id=6, customer_name="Arjun Verma", party_size=4, reserved_at=datetime.utcnow() + timedelta(hours=2), status="reserved"),
        Reservation(reservation_id=2, table_id=10, customer_name="Meera Iyer", party_size=2, reserved_at=datetime.utcnow() + timedelta(hours=3), status="reserved"),
    ]
    orders = [
        Order(order_id=1, table_id=1, staff_id=2, status="pending", created_at=datetime.utcnow() - timedelta(minutes=75), updated_at=datetime.utcnow() - timedelta(minutes=75), notes="No onions"),
        Order(order_id=2, table_id=2, staff_id=2, status="cooking", created_at=datetime.utcnow() - timedelta(minutes=58), updated_at=datetime.utcnow() - timedelta(minutes=45), notes="Extra spicy"),
        Order(order_id=3, table_id=3, staff_id=3, status="ready", created_at=datetime.utcnow() - timedelta(minutes=42), updated_at=datetime.utcnow() - timedelta(minutes=12), notes="Kids meal split"),
        Order(order_id=4, table_id=4, staff_id=3, status="served", created_at=datetime.utcnow() - timedelta(minutes=30), updated_at=datetime.utcnow() - timedelta(minutes=8), notes="Table merge request"),
        Order(order_id=5, table_id=5, staff_id=2, status="billed", created_at=datetime.utcnow() - timedelta(minutes=18), updated_at=datetime.utcnow() - timedelta(minutes=2), notes="Paid by card"),
    ]
    order_items = [
        OrderItem(order_item_id=1, order_id=1, item_id=1, quantity=2, unit_price=249, special_notes="Light cheese"),
        OrderItem(order_item_id=2, order_id=1, item_id=12, quantity=1, unit_price=119, special_notes=None),
        OrderItem(order_item_id=3, order_id=2, item_id=3, quantity=1, unit_price=219, special_notes="No mayo"),
        OrderItem(order_item_id=4, order_id=2, item_id=9, quantity=2, unit_price=99, special_notes="Less sugar"),
        OrderItem(order_item_id=5, order_id=3, item_id=4, quantity=2, unit_price=179, special_notes=None),
        OrderItem(order_item_id=6, order_id=3, item_id=20, quantity=1, unit_price=129, special_notes="Toasted"),
        OrderItem(order_item_id=7, order_id=4, item_id=5, quantity=1, unit_price=329, special_notes=None),
        OrderItem(order_item_id=8, order_id=4, item_id=8, quantity=2, unit_price=129, special_notes="No ice"),
        OrderItem(order_item_id=9, order_id=5, item_id=7, quantity=1, unit_price=159, special_notes=None),
        OrderItem(order_item_id=10, order_id=5, item_id=10, quantity=1, unit_price=149, special_notes=None),
        OrderItem(order_item_id=11, order_id=5, item_id=17, quantity=2, unit_price=109, special_notes="Less sweet"),
    ]
    bills = [
        Bill(bill_id=1, order_id=5, subtotal=526, tax_amount=26.30, service_charge=10.52, total=562.82, payment_mode="Card", billed_at=datetime.utcnow() - timedelta(minutes=2), staff_id=4),
    ]
    inventory_logs = [
        InventoryLog(log_id=1, inventory_id=7, change_amount=-6, change_type="deduction", changed_at=datetime.utcnow() - timedelta(hours=1), staff_id=5),
        InventoryLog(log_id=2, inventory_id=8, change_amount=20, change_type="restock", changed_at=datetime.utcnow() - timedelta(hours=5), staff_id=1),
        InventoryLog(log_id=3, inventory_id=2, change_amount=-4, change_type="deduction", changed_at=datetime.utcnow() - timedelta(hours=3), staff_id=5),
    ]

    session.add_all(reservations + orders + order_items + bills + inventory_logs)


def seed_if_empty(session):
    if session.query(Staff).first():
        return False
    seed_sample_data(session)
    return True