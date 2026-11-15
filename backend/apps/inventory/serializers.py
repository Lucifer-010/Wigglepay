from decimal import Decimal
from rest_framework import serializers
from .models import Category, Product
from apps.merchants.models import Merchant

class CategorySerializer(serializers.ModelSerializer):
    merchant = serializers.PrimaryKeyRelatedField(queryset=Merchant.objects.all(), required=False)
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = [
            'id',
            'merchant',
            'name',
            'slug',
            'description',
            'icon',
            'color',
            'display_order',
            'is_active',
            'product_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'product_count', 'created_at', 'updated_at']

    def create(self, validated_data):
        if 'merchant' not in validated_data or not validated_data['merchant']:
            request = self.context.get('request')
            if request and hasattr(request, 'user') and hasattr(request.user, 'merchant_profile'):
                validated_data['merchant'] = request.user.merchant_profile
            else:
                validated_data['merchant'] = Merchant.objects.first()
        return super().create(validated_data)


class ProductSerializer(serializers.ModelSerializer):
    merchant = serializers.PrimaryKeyRelatedField(queryset=Merchant.objects.all(), required=False)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'merchant',
            'category',
            'category_name',
            'category_color',
            'title',
            'sku',
            'description',
            'price',
            'currency',
            'stock_quantity',
            'track_stock',
            'is_in_stock',
            'image_url',
            'badge',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'category_name', 'category_color', 'is_in_stock', 'created_at', 'updated_at']

    def create(self, validated_data):
        if 'merchant' not in validated_data or not validated_data['merchant']:
            from apps.merchants.models import Merchant
            request = self.context.get('request')
            if request and hasattr(request, 'user') and hasattr(request.user, 'merchant_profile'):
                validated_data['merchant'] = request.user.merchant_profile
            else:
                validated_data['merchant'] = Merchant.objects.first()
        return super().create(validated_data)


class StockAdjustmentSerializer(serializers.Serializer):
    adjustment = serializers.IntegerField(help_text="Number of units to add (positive) or deduct (negative)")
    reason = serializers.CharField(required=False, default='manual', help_text="Reason for stock modification")
