from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer, StockAdjustmentSerializer

@extend_schema(tags=['Inventory'])
class CategoryViewSet(viewsets.ModelViewSet):
    """
    Manage Inventory Shelves and Product Categories.
    """
    queryset = Category.objects.prefetch_related('products').all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['merchant', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['display_order', 'name', 'created_at']
    ordering = ['display_order', 'name']

    @extend_schema(
        summary="List all active products under this category/shelf",
        responses={200: ProductSerializer(many=True)}
    )
    @action(detail=True, methods=['get'], url_path='products')
    def products(self, request, pk=None):
        category = self.get_object()
        products = category.products.filter(is_active=True)
        return Response(ProductSerializer(products, many=True, context={'request': request}).data)


@extend_schema(tags=['Inventory'])
class ProductViewSet(viewsets.ModelViewSet):
    """
    Manage Inventory Products, Pricing, and Stock.
    """
    queryset = Product.objects.select_related('category', 'merchant').all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'merchant', 'currency', 'is_active', 'track_stock']
    search_fields = ['title', 'sku', 'description']
    ordering_fields = ['title', 'price', 'stock_quantity', 'created_at']
    ordering = ['-created_at']

    @extend_schema(
        summary="Adjust product stock inventory",
        request=StockAdjustmentSerializer,
        responses={200: ProductSerializer}
    )
    @action(detail=True, methods=['post'], url_path='adjust-stock')
    def adjust_stock(self, request, pk=None):
        product = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        adjustment = serializer.validated_data['adjustment']
        product.stock_quantity = max(0, product.stock_quantity + adjustment)
        product.save(update_fields=['stock_quantity', 'updated_at'])

        return Response(ProductSerializer(product, context={'request': request}).data)

