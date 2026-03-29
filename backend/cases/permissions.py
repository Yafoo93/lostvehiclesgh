from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrModeratorOrReadOnly(BasePermission):
    """
    - SAFE methods (GET, HEAD, OPTIONS): allowed for aunthenticated users.
    - Write methods:
        - Moderators/Admins: full access.
        - Owners: can modify/delete their own cases.
    """

    def has_permission(self, request, view):
        # must authenticated to read
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Must be authenticated to write
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        if not (user and user.is_authenticated):
            return False

        # Moderators and admins can do anything
        role = getattr(user, "role", None)
        if role in ("MODERATOR", "ADMIN"):
            return True

        # Otherwise, only the reporter can modify
        return obj.reporter_id == user.id
