@extends('templates.' . $page->template->getSlug())

@section('title')
{{ $page->title }}
@endsection

@section('keywords')
{{ $page->keywords }}
@endsection

@section('description')
{{ $page->description }}
@endsection

@section('content')
    <div @frontWidget(page, $page)>
        <h3 @frontField(title, input)>{{ $page->title }}</h3>
        <div @frontField(content, tiny)>
            @widget('ReplaceWidget', [], $page->content)
        </div>
    </div>
@endsection

@section('site-bar')
    основное меню
    <ul class="list-group">
        @foreach($menu as $item)
            <li @frontWidget(page, $item)class=" list-group-item
                @if($item->is_active)
                    active
                @endif
            "><a @frontField(title_in_menu, input) href="/{{ $item->full_url }}">{{$item->title_in_menu}}</a></li>
        @endforeach
    </ul>
    <br>
    дочернии страницы
    <ul class="list-group">
        @foreach($child_menu as $item)
            <li @frontWidget(page, $item) class=" list-group-item
                @if($item->is_active)
                    active
                @endif
                    "><a @frontField(title_in_menu, input) href="/{{ $item->full_url }}">{{$item->title_in_menu}}</a></li>
        @endforeach
    </ul>
@endsection