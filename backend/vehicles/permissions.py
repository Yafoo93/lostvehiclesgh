from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsVehicleOwnerOrModeratorOrReadOnly(BasePermission):
    """
    - SAFE methods (GET/HEAD/OPTIONS): any authenticated user
    - Write methods (POST/PUT/PATCH/DELETE):
        * Moderators/Admins: can manage any vehicle
        * Owners: can only manage their own vehicles
    """

    def has_permission(self, request, view):
        user = request.user

        # Must be authenticated for all vehicle endpoints
        if not (user and user.is_authenticated):
            return False

        # For now, any authenticated user can hit list/retrieve/create;
        # object-level checks will handle ownership.
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user

        if not (user and user.is_authenticated):
            return False

        # SAFE methods: any authenticated user can view
        if request.method in SAFE_METHODS:
            return True

        # Moderators/Admins: full access
        if getattr(user, "is_moderator", False) or getattr(user, "is_admin", False):
            return True

        # Owners: can modify only their own vehicles
        return obj.owner_id == user.id
