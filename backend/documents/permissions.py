from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanAccessCaseDocuments(BasePermission):
    """
    - Moderators/Admins: full access.
    - Owner (reporter of the case): can list/upload documents for their case.
    - Others: no access.
    """

    def has_permission(self, request, view):
        # Must be authenticated to even touch documents
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # We won't rely heavily on object-level here for now,
        # main check will be done in view with the case.
        return True
