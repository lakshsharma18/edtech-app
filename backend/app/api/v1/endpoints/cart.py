from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.cart import CartItem
from app.models.course import Course
from app.schemas.cart import CartAddRequest, CartItemResponse
from app.core.security import require_user  # ✅ Swapped to enforce the strict student user guard

router = APIRouter()


# 🛒 ENDPOINT 1: GET ALL ITEMS IN CART
@router.get("/cart", response_model=List[CartItemResponse])
def get_cart_items(
    db: Session = Depends(get_db), 
    current_student = Depends(require_user)  # 🔒 Enforces 'user' role strictly before querying
):
    """
    Fetches all course rows currently saved in the database cart for the logged-in student.
    Runs when the user logs in or refreshes the page to load their data.
    """
    # 1. Query the 'cart_items' table matching strictly the active user's ID
    items = db.query(CartItem).filter(CartItem.user_id == current_student["user_id"]).all()
    
    response = []
    # 2. Iterate through each database cart record and extract its course metadata details
    for item in items:
        course = db.query(Course).filter(Course.id == item.course_id).first()
        if course:
            response.append({
                "id": item.id,
                "course_id": course.id,
                "title": course.title,
                "price": float(course.price)
            })
            
    return response


# 🛒 ENDPOINT 2: ADD ITEM TO CART
@router.post("/cart/add")
def add_to_cart(
    data: CartAddRequest, 
    db: Session = Depends(get_db), 
    current_student = Depends(require_user)  # 🔒 Enforces 'user' role strictly
):
    """
    Saves a fresh course item selection securely into the database cart table.
    Enforces a strict duplicate verification check.
    """
    # 1. Verification Gate: Ensure the course they are adding actually exists
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # 2. Duplicate Prevention Gate: Check if this user already added this course row
    existing_item = db.query(CartItem).filter(
        CartItem.user_id == current_student["user_id"],
        CartItem.course_id == data.course_id
    ).first()
    
    if existing_item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Course is already in your cart"
        )

    # 3. Save the item row firmly into your database storage table
    new_item = CartItem(user_id=current_student["user_id"], course_id=data.course_id)
    db.add(new_item)
    db.commit()
    
    return {"message": "Course added to cart successfully"}


# 🛒 ENDPOINT 3: REMOVE SINGLE ITEM FROM CART
@router.delete("/cart/remove/{course_id}")
def remove_from_cart(
    course_id: int, 
    db: Session = Depends(get_db), 
    current_student = Depends(require_user)  # 🔒 Enforces 'user' role strictly
):
    """
    Deletes an explicit course item row from the database cart table matching this user.
    """
    # Look up the row belonging to this user and this course
    item = db.query(CartItem).filter(
        CartItem.user_id == current_student["user_id"],
        CartItem.course_id == course_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in cart")
        
    # Execute the raw delete action command
    db.delete(item)
    db.commit()
    
    return {"message": "Item removed from cart successfully"}


# 🛒 ENDPOINT 4: CLEAR ENTIRE CART
@router.delete("/cart/clear")
def clear_cart(
    db: Session = Depends(get_db), 
    current_student = Depends(require_user)  # 🔒 Enforces 'user' role strictly
):
    """
    Wipes out all cart items for this user. 
    Runs when they click clear or when their Stripe payment checkout webhook succeeds!
    """
    db.query(CartItem).filter(CartItem.user_id == current_student["user_id"]).delete()
    db.commit()
    
    return {"message": "Cart cleared successfully"}
