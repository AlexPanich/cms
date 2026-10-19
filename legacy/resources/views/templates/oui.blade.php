@extends('layouts.oui')

@section('body')
    <div id="page-container" class="sidebar-l sidebar-mini sidebar-o side-scroll header-navbar-fixed header-navbar-transparent">
        @can('view_dashboard')
            @include('frontend.oui.partitions.sidebar')
        @endcan

        @include('frontend.oui.partitions.header')

        @include('frontend.oui.partitions.main')

        @include('frontend.oui.partitions.footer')
    </div>

    @parent
@endsection



