from finance_management.utils.get_networth import get_networth, get_netWorth_details
from finance_management.utils.get_category import get_category


def get_user_networth_service(user):
    """
    Get total networth for a user.
    
    Args:
        user: User object
        
    Returns:
        float: Total networth value
    """
    # Create a mock request object with user
    class MockRequest:
        def __init__(self, user):
            self.user = user
    
    request = MockRequest(user)
    return get_networth(request)


def get_user_networth_details_service(user):
    """
    Get networth details per currency for a user.
    
    Args:
        user: User object
        
    Returns:
        dict: Networth details per currency
    """
    # Create a mock request object with user
    class MockRequest:
        def __init__(self, user):
            self.user = user
    
    request = MockRequest(user)
    return get_netWorth_details(request)


def get_user_categories_service(user, status='ANY'):
    """
    Get user's most frequently used categories filtered by status.
    
    Args:
        user: User object
        status: Transaction status filter (Deposit, Withdraw, or ANY)
        
    Returns:
        list: List of category names
    """
    return get_category(user, status)
